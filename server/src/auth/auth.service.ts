import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { createHash, randomInt } from 'crypto';
import { DB_TOKEN } from '../db/db.module';
import type { Db } from '../db/types';
import {
  authIdentities,
  authSessions,
  emailLoginCodes,
  loginTickets,
  oauthStates,
  users,
} from '../db/schema';
import { EmailOtpProvider } from './providers/email-otp.provider';
import { QqOAuthProvider } from './providers/qq-oauth.provider';
import { WechatOAuthProvider } from './providers/wechat-oauth.provider';
import { TokenService } from './token.service';
import type { AuthUser, OAuthProfile, OAuthProvider } from './auth.types';

const SUPPORTED_EMAIL_DOMAINS = new Set(['qq.com', 'vip.qq.com', 'gmail.com', 'googlemail.com']);

/**
 * AuthService 是登录模块的业务核心。
 *
 * Controller 只负责 HTTP，真正的登录规则都放在这里：
 * - 邮箱验证码生成、限流、校验
 * - QQ/微信 OAuth state 校验
 * - 内部用户创建与第三方身份绑定
 * - token / refresh token / login ticket 签发
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: Db,
    private readonly emailOtpProvider: EmailOtpProvider,
    private readonly qqOAuthProvider: QqOAuthProvider,
    private readonly wechatOAuthProvider: WechatOAuthProvider,
    private readonly tokenService: TokenService,
  ) {}

  /** 发送邮箱验证码：先做邮箱标准化、域名白名单和发送频率限制。 */
  async sendEmailCode(email: string, ipAddress?: string) {
    const normalizedEmail = this.normalizeEmail(email);
    this.assertSupportedEmail(normalizedEmail);

    const latest = await this.db
      .select()
      .from(emailLoginCodes)
      .where(eq(emailLoginCodes.email, normalizedEmail))
      .orderBy(desc(emailLoginCodes.createdAt))
      .limit(1);

    const latestCreatedAt = latest[0]?.createdAt?.getTime();
    if (latestCreatedAt && Date.now() - latestCreatedAt < 60_000) {
      throw new BadRequestException('请求过于频繁，请稍后再试');
    }

    // 生成 6 位数字验证码。数据库只保存哈希，明文只用于发送。
    const code = String(randomInt(100000, 1000000));
    await this.db.insert(emailLoginCodes).values({
      email: normalizedEmail,
      codeHash: this.hashCode(normalizedEmail, code),
      ipAddress,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await this.emailOtpProvider.sendCode(normalizedEmail, code);
    return { message: '验证码已发送' };
  }

  /** 校验邮箱验证码：验证码正确后创建/查找用户，并签发系统登录态。 */
  async verifyEmailCode(email: string, code: string, meta: RequestMeta = {}) {
    const normalizedEmail = this.normalizeEmail(email);
    this.assertSupportedEmail(normalizedEmail);

    const rows = await this.db
      .select()
      .from(emailLoginCodes)
      .where(and(eq(emailLoginCodes.email, normalizedEmail), isNull(emailLoginCodes.consumedAt)))
      .orderBy(desc(emailLoginCodes.createdAt))
      .limit(1);

    const loginCode = rows[0];
    if (!loginCode || loginCode.expiresAt.getTime() < Date.now() || loginCode.attempts >= 5) {
      throw new BadRequestException('验证码错误或已过期');
    }

    if (loginCode.codeHash !== this.hashCode(normalizedEmail, code)) {
      // 错误次数入库，避免攻击者无限猜测验证码。
      await this.db
        .update(emailLoginCodes)
        .set({ attempts: sql`${emailLoginCodes.attempts} + 1` })
        .where(eq(emailLoginCodes.id, loginCode.id));
      throw new BadRequestException('验证码错误或已过期');
    }

    // 验证码只允许消费一次，防止重复提交或重放攻击。
    await this.db
      .update(emailLoginCodes)
      .set({ consumedAt: new Date() })
      .where(eq(emailLoginCodes.id, loginCode.id));

    const user = await this.findOrCreateEmailUser(normalizedEmail);
    return this.issueLogin(user, meta);
  }

  /**
   * 生成 QQ/微信授权 URL。
   *
   * state 必须由后端生成并存储，回调时再校验，防止第三方回调被伪造。
   */
  async createOAuthAuthorizeUrl(provider: OAuthProvider, redirectTo?: string) {
    this.assertOAuthProvider(provider);
    const state = this.tokenService.createOpaqueToken(24);
    await this.db.insert(oauthStates).values({
      provider,
      state,
      redirectTo: this.safeRedirectPath(redirectTo),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    return {
      url: this.getOAuthProvider(provider).createAuthorizeUrl(state, this.getOAuthCallbackUrl(provider)),
    };
  }

  /**
   * 处理 QQ/微信 OAuth 回调。
   *
   * 回调里只能拿到 code 和 state，不能直接认为用户已登录；
   * 必须先校验 state，再用 code 向第三方平台换用户资料。
   */
  async handleOAuthCallback(provider: OAuthProvider, code: string, state: string) {
    this.assertOAuthProvider(provider);
    if (!code || !state) {
      throw new BadRequestException('登录参数缺失');
    }
    const stateRows = await this.db
      .select()
      .from(oauthStates)
      .where(and(eq(oauthStates.provider, provider), eq(oauthStates.state, state), isNull(oauthStates.consumedAt)))
      .limit(1);

    const oauthState = stateRows[0];
    if (!oauthState || oauthState.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('登录状态已失效，请重新扫码');
    }

    // state 一次性消费，避免同一个授权回调被重复使用。
    await this.db.update(oauthStates).set({ consumedAt: new Date() }).where(eq(oauthStates.id, oauthState.id));

    const profile = await this.getOAuthProvider(provider).exchangeCode(code, this.getOAuthCallbackUrl(provider));
    const user = await this.findOrCreateOAuthUser(profile);
    // 不把 token 放 URL，而是给前端一个短期 ticket 再换 token。
    const ticket = await this.createLoginTicket(Number(user.id));

    return {
      ticket,
      redirectTo: oauthState.redirectTo || '/',
    };
  }

  /** 使用一次性 ticket 换系统 token。ticket 成功使用后立即失效。 */
  async exchangeLoginTicket(ticket: string, meta: RequestMeta = {}) {
    const ticketHash = this.tokenService.hashOpaqueToken(ticket);
    const rows = await this.db
      .select({ ticket: loginTickets, user: users })
      .from(loginTickets)
      .innerJoin(users, eq(loginTickets.userId, users.id))
      .where(and(eq(loginTickets.ticketHash, ticketHash), isNull(loginTickets.consumedAt)))
      .limit(1);

    const row = rows[0];
    if (!row || row.ticket.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('登录凭证已失效，请重新登录');
    }

    await this.db.update(loginTickets).set({ consumedAt: new Date() }).where(eq(loginTickets.id, row.ticket.id));
    return this.issueLogin(this.toAuthUser(row.user), meta);
  }

  /** 根据 token 中的 userId 获取当前用户信息。 */
  async getMe(userId: string) {
    const rows = await this.db.select().from(users).where(eq(users.id, Number(userId))).limit(1);
    const user = rows[0];
    if (!user) throw new NotFoundException('用户不存在');
    return this.toAuthUser(user);
  }

  /** 给 JwtAuthGuard 复用的 token 校验方法。 */
  verifyAccessToken(token: string) {
    return this.tokenService.verifyAccessToken(token);
  }

  /** 邮箱首次登录自动创建用户，二次登录直接复用同一个 users.id。 */
  private async findOrCreateEmailUser(email: string): Promise<AuthUser> {
    const existing = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing[0]) return this.toAuthUser(existing[0]);

    const nickname = email.split('@')[0] || '精灵用户';
    const [user] = await this.db.insert(users).values({ email, nickname }).returning();
    await this.db.insert(authIdentities).values({
      userId: user.id,
      provider: 'email',
      providerUserId: email,
      email,
      nickname,
    });
    return this.toAuthUser(user);
  }

  /**
   * QQ/微信用户查找或创建。
   *
   * 查找条件是 provider + providerUserId，而不是昵称或头像；
   * 昵称头像会变，但 openid/unionid 才是稳定身份。
   */
  private async findOrCreateOAuthUser(profile: OAuthProfile): Promise<AuthUser> {
    const identityRows = await this.db
      .select({ identity: authIdentities, user: users })
      .from(authIdentities)
      .innerJoin(users, eq(authIdentities.userId, users.id))
      .where(
        and(
          eq(authIdentities.provider, profile.provider),
          eq(authIdentities.providerUserId, profile.providerUserId),
        ),
      )
      .limit(1);

    if (identityRows[0]) return this.toAuthUser(identityRows[0].user);

    const [user] = await this.db
      .insert(users)
      .values({
        email: profile.email ?? null,
        nickname: profile.nickname || '精灵用户',
        avatarUrl: profile.avatarUrl ?? null,
      })
      .returning();

    await this.db.insert(authIdentities).values({
      userId: user.id,
      provider: profile.provider,
      providerUserId: profile.providerUserId,
      email: profile.email ?? null,
      unionId: profile.unionId ?? null,
      nickname: profile.nickname ?? null,
      avatarUrl: profile.avatarUrl ?? null,
    });

    return this.toAuthUser(user);
  }

  /** 签发登录态，并把 refresh token 哈希写入 auth_sessions。 */
  private async issueLogin(user: AuthUser, meta: RequestMeta) {
    const token = this.tokenService.signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = this.tokenService.createOpaqueToken(48);
    const ttlDays = Number(process.env.AUTH_REFRESH_TOKEN_TTL_DAYS || 30);

    await this.db.insert(authSessions).values({
      userId: Number(user.id),
      refreshTokenHash: this.tokenService.hashOpaqueToken(refreshToken),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000),
    });

    return {
      token,
      refreshToken,
      user,
    };
  }

  /** 创建 2 分钟有效的一次性 ticket，用于 OAuth 回调后的前端换 token。 */
  private async createLoginTicket(userId: number) {
    const ticket = this.tokenService.createOpaqueToken(32);
    await this.db.insert(loginTickets).values({
      ticketHash: this.tokenService.hashOpaqueToken(ticket),
      userId,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000),
    });
    return ticket;
  }

  /** 根据 provider 选择对应的外部平台适配器。 */
  private getOAuthProvider(provider: OAuthProvider) {
    this.assertOAuthProvider(provider);
    if (provider === 'qq') return this.qqOAuthProvider;
    return this.wechatOAuthProvider;
  }

  private assertOAuthProvider(provider: string): asserts provider is OAuthProvider {
    if (provider !== 'qq' && provider !== 'wechat') {
      throw new BadRequestException('不支持的登录方式');
    }
  }

  /** 后端公开回调地址，必须和 QQ/微信开放平台后台配置一致。 */
  private getOAuthCallbackUrl(provider: OAuthProvider) {
    const serverUrl = (process.env.AUTH_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/+$/, '');
    return `${serverUrl}/api/auth/oauth/${provider}/callback`;
  }

  /** 邮箱统一转小写，避免 Test@QQ.com 和 test@qq.com 被当成两个账号。 */
  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  /** MVP 只允许 QQ 邮箱和 Gmail，避免开放注册范围过大。 */
  private assertSupportedEmail(email: string) {
    const domain = email.split('@')[1];
    if (!domain || !SUPPORTED_EMAIL_DOMAINS.has(domain)) {
      throw new BadRequestException('当前仅支持 QQ 邮箱和 Gmail');
    }
  }

  /** 验证码哈希混入邮箱和 JWT_SECRET，避免不同邮箱共用同一验证码哈希。 */
  private hashCode(email: string, code: string) {
    return createHash('sha256').update(`${email}:${code}:${process.env.JWT_SECRET || ''}`).digest('hex');
  }

  /** 只允许站内跳转路径，防止登录后被带到外部钓鱼站。 */
  private safeRedirectPath(redirectTo?: string) {
    if (!redirectTo) return '/';
    return redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/';
  }

  /** 将数据库字段转换成前端兼容的 userInfo 字段。 */
  private toAuthUser(user: typeof users.$inferSelect): AuthUser {
    return {
      id: String(user.id),
      email: user.email,
      nickName: user.nickname || '精灵用户',
      avatarUrl: user.avatarUrl,
    };
  }
}

export interface RequestMeta {
  /** 登录设备信息，后续可用于设备管理。 */
  userAgent?: string;
  /** 登录来源 IP，后续可用于风控。 */
  ipAddress?: string;
}
