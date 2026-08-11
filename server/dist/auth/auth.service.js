"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const crypto_1 = require("crypto");
const db_module_1 = require("../db/db.module");
const schema_1 = require("../db/schema");
const email_otp_provider_1 = require("./providers/email-otp.provider");
const qq_oauth_provider_1 = require("./providers/qq-oauth.provider");
const wechat_oauth_provider_1 = require("./providers/wechat-oauth.provider");
const token_service_1 = require("./token.service");
const SUPPORTED_EMAIL_DOMAINS = new Set(['qq.com', 'vip.qq.com', 'gmail.com', 'googlemail.com']);
let AuthService = class AuthService {
    db;
    emailOtpProvider;
    qqOAuthProvider;
    wechatOAuthProvider;
    tokenService;
    constructor(db, emailOtpProvider, qqOAuthProvider, wechatOAuthProvider, tokenService) {
        this.db = db;
        this.emailOtpProvider = emailOtpProvider;
        this.qqOAuthProvider = qqOAuthProvider;
        this.wechatOAuthProvider = wechatOAuthProvider;
        this.tokenService = tokenService;
    }
    async sendEmailCode(email, ipAddress) {
        const normalizedEmail = this.normalizeEmail(email);
        this.assertSupportedEmail(normalizedEmail);
        const latest = await this.db
            .select()
            .from(schema_1.emailLoginCodes)
            .where((0, drizzle_orm_1.eq)(schema_1.emailLoginCodes.email, normalizedEmail))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.emailLoginCodes.createdAt))
            .limit(1);
        const latestCreatedAt = latest[0]?.createdAt?.getTime();
        if (latestCreatedAt && Date.now() - latestCreatedAt < 60_000) {
            throw new common_1.BadRequestException('请求过于频繁，请稍后再试');
        }
        const code = String((0, crypto_1.randomInt)(100000, 1000000));
        await this.db.insert(schema_1.emailLoginCodes).values({
            email: normalizedEmail,
            codeHash: this.hashCode(normalizedEmail, code),
            ipAddress,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });
        await this.emailOtpProvider.sendCode(normalizedEmail, code);
        return { message: '验证码已发送' };
    }
    async verifyEmailCode(email, code, meta = {}) {
        const normalizedEmail = this.normalizeEmail(email);
        this.assertSupportedEmail(normalizedEmail);
        const rows = await this.db
            .select()
            .from(schema_1.emailLoginCodes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.emailLoginCodes.email, normalizedEmail), (0, drizzle_orm_1.isNull)(schema_1.emailLoginCodes.consumedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.emailLoginCodes.createdAt))
            .limit(1);
        const loginCode = rows[0];
        if (!loginCode || loginCode.expiresAt.getTime() < Date.now() || loginCode.attempts >= 5) {
            throw new common_1.BadRequestException('验证码错误或已过期');
        }
        if (loginCode.codeHash !== this.hashCode(normalizedEmail, code)) {
            await this.db
                .update(schema_1.emailLoginCodes)
                .set({ attempts: (0, drizzle_orm_1.sql) `${schema_1.emailLoginCodes.attempts} + 1` })
                .where((0, drizzle_orm_1.eq)(schema_1.emailLoginCodes.id, loginCode.id));
            throw new common_1.BadRequestException('验证码错误或已过期');
        }
        await this.db
            .update(schema_1.emailLoginCodes)
            .set({ consumedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.emailLoginCodes.id, loginCode.id));
        const user = await this.findOrCreateEmailUser(normalizedEmail);
        return this.issueLogin(user, meta);
    }
    async createOAuthAuthorizeUrl(provider, redirectTo) {
        this.assertOAuthProvider(provider);
        const state = this.tokenService.createOpaqueToken(24);
        await this.db.insert(schema_1.oauthStates).values({
            provider,
            state,
            redirectTo: this.safeRedirectPath(redirectTo),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });
        return {
            url: this.getOAuthProvider(provider).createAuthorizeUrl(state, this.getOAuthCallbackUrl(provider)),
        };
    }
    async handleOAuthCallback(provider, code, state) {
        this.assertOAuthProvider(provider);
        if (!code || !state) {
            throw new common_1.BadRequestException('登录参数缺失');
        }
        const stateRows = await this.db
            .select()
            .from(schema_1.oauthStates)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.oauthStates.provider, provider), (0, drizzle_orm_1.eq)(schema_1.oauthStates.state, state), (0, drizzle_orm_1.isNull)(schema_1.oauthStates.consumedAt)))
            .limit(1);
        const oauthState = stateRows[0];
        if (!oauthState || oauthState.expiresAt.getTime() < Date.now()) {
            throw new common_1.UnauthorizedException('登录状态已失效，请重新扫码');
        }
        await this.db.update(schema_1.oauthStates).set({ consumedAt: new Date() }).where((0, drizzle_orm_1.eq)(schema_1.oauthStates.id, oauthState.id));
        const profile = await this.getOAuthProvider(provider).exchangeCode(code, this.getOAuthCallbackUrl(provider));
        const user = await this.findOrCreateOAuthUser(profile);
        const ticket = await this.createLoginTicket(Number(user.id));
        return {
            ticket,
            redirectTo: oauthState.redirectTo || '/',
        };
    }
    async exchangeLoginTicket(ticket, meta = {}) {
        const ticketHash = this.tokenService.hashOpaqueToken(ticket);
        const rows = await this.db
            .select({ ticket: schema_1.loginTickets, user: schema_1.users })
            .from(schema_1.loginTickets)
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.loginTickets.userId, schema_1.users.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.loginTickets.ticketHash, ticketHash), (0, drizzle_orm_1.isNull)(schema_1.loginTickets.consumedAt)))
            .limit(1);
        const row = rows[0];
        if (!row || row.ticket.expiresAt.getTime() < Date.now()) {
            throw new common_1.UnauthorizedException('登录凭证已失效，请重新登录');
        }
        await this.db.update(schema_1.loginTickets).set({ consumedAt: new Date() }).where((0, drizzle_orm_1.eq)(schema_1.loginTickets.id, row.ticket.id));
        return this.issueLogin(this.toAuthUser(row.user), meta);
    }
    async getMe(userId) {
        const rows = await this.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, Number(userId))).limit(1);
        const user = rows[0];
        if (!user)
            throw new common_1.NotFoundException('用户不存在');
        return this.toAuthUser(user);
    }
    verifyAccessToken(token) {
        return this.tokenService.verifyAccessToken(token);
    }
    async findOrCreateEmailUser(email) {
        const existing = await this.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email)).limit(1);
        if (existing[0])
            return this.toAuthUser(existing[0]);
        const nickname = email.split('@')[0] || '精灵用户';
        const [user] = await this.db.insert(schema_1.users).values({ email, nickname }).returning();
        await this.db.insert(schema_1.authIdentities).values({
            userId: user.id,
            provider: 'email',
            providerUserId: email,
            email,
            nickname,
        });
        return this.toAuthUser(user);
    }
    async findOrCreateOAuthUser(profile) {
        const identityRows = await this.db
            .select({ identity: schema_1.authIdentities, user: schema_1.users })
            .from(schema_1.authIdentities)
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.authIdentities.userId, schema_1.users.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.authIdentities.provider, profile.provider), (0, drizzle_orm_1.eq)(schema_1.authIdentities.providerUserId, profile.providerUserId)))
            .limit(1);
        if (identityRows[0])
            return this.toAuthUser(identityRows[0].user);
        const [user] = await this.db
            .insert(schema_1.users)
            .values({
            email: profile.email ?? null,
            nickname: profile.nickname || '精灵用户',
            avatarUrl: profile.avatarUrl ?? null,
        })
            .returning();
        await this.db.insert(schema_1.authIdentities).values({
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
    async issueLogin(user, meta) {
        const token = this.tokenService.signAccessToken({ sub: user.id, email: user.email });
        const refreshToken = this.tokenService.createOpaqueToken(48);
        const ttlDays = Number(process.env.AUTH_REFRESH_TOKEN_TTL_DAYS || 30);
        await this.db.insert(schema_1.authSessions).values({
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
    async createLoginTicket(userId) {
        const ticket = this.tokenService.createOpaqueToken(32);
        await this.db.insert(schema_1.loginTickets).values({
            ticketHash: this.tokenService.hashOpaqueToken(ticket),
            userId,
            expiresAt: new Date(Date.now() + 2 * 60 * 1000),
        });
        return ticket;
    }
    getOAuthProvider(provider) {
        this.assertOAuthProvider(provider);
        if (provider === 'qq')
            return this.qqOAuthProvider;
        return this.wechatOAuthProvider;
    }
    assertOAuthProvider(provider) {
        if (provider !== 'qq' && provider !== 'wechat') {
            throw new common_1.BadRequestException('不支持的登录方式');
        }
    }
    getOAuthCallbackUrl(provider) {
        const serverUrl = (process.env.AUTH_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/+$/, '');
        return `${serverUrl}/api/auth/oauth/${provider}/callback`;
    }
    normalizeEmail(email) {
        return email.trim().toLowerCase();
    }
    assertSupportedEmail(email) {
        const domain = email.split('@')[1];
        if (!domain || !SUPPORTED_EMAIL_DOMAINS.has(domain)) {
            throw new common_1.BadRequestException('当前仅支持 QQ 邮箱和 Gmail');
        }
    }
    hashCode(email, code) {
        return (0, crypto_1.createHash)('sha256').update(`${email}:${code}:${process.env.JWT_SECRET || ''}`).digest('hex');
    }
    safeRedirectPath(redirectTo) {
        if (!redirectTo)
            return '/';
        return redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/';
    }
    toAuthUser(user) {
        return {
            id: String(user.id),
            email: user.email,
            nickName: user.nickname || '精灵用户',
            avatarUrl: user.avatarUrl,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(db_module_1.DB_TOKEN)),
    __metadata("design:paramtypes", [Object, email_otp_provider_1.EmailOtpProvider,
        qq_oauth_provider_1.QqOAuthProvider,
        wechat_oauth_provider_1.WechatOAuthProvider,
        token_service_1.TokenService])
], AuthService);
//# sourceMappingURL=auth.service.js.map