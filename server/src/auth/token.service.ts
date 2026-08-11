import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

export interface TokenPayload {
  /** JWT 标准字段 subject，这里存内部 userId。 */
  sub: string;
  email?: string | null;
  /** 过期时间，单位秒。 */
  exp: number;
  /** 签发时间，单位秒。 */
  iat: number;
}

@Injectable()
export class TokenService {
  private get secret() {
    return process.env.JWT_SECRET || 'change-me-in-production';
  }

  /**
   * 签发短期 access token。
   *
   * 这里没有引入额外 JWT 依赖，而是用 HMAC-SHA256 实现最小可用版本：
   * - payload 不加密，只签名，所以不要放敏感信息
   * - 服务端用 JWT_SECRET 验签
   * - 过期时间由 JWT_ACCESS_TOKEN_TTL_SECONDS 控制
   */
  signAccessToken(payload: Omit<TokenPayload, 'exp' | 'iat'>) {
    const now = Math.floor(Date.now() / 1000);
    const ttl = Number(process.env.JWT_ACCESS_TOKEN_TTL_SECONDS || 7200);
    const body: TokenPayload = {
      ...payload,
      iat: now,
      exp: now + ttl,
    };
    const header = this.base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const encodedPayload = this.base64Url(JSON.stringify(body));
    const signature = this.sign(`${header}.${encodedPayload}`);
    return `${header}.${encodedPayload}.${signature}`;
  }

  /** 校验 access token：结构、签名、过期时间任一不合法都返回 401。 */
  verifyAccessToken(token: string): TokenPayload {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }
    const expected = this.sign(`${header}.${payload}`);
    if (!this.safeEqual(signature, expected)) {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as TokenPayload;
    if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }
    return decoded;
  }

  /** 生成不可预测的随机 token，适合 refresh token、OAuth state、login ticket。 */
  createOpaqueToken(bytes = 32) {
    return randomBytes(bytes).toString('base64url');
  }

  /**
   * 对 refresh token / ticket 做哈希后再入库。
   * 即使数据库泄露，攻击者也不能直接拿明文 token 登录。
   */
  hashOpaqueToken(token: string) {
    return createHmac('sha256', this.secret).update(token).digest('hex');
  }

  private sign(value: string) {
    return createHmac('sha256', this.secret).update(value).digest('base64url');
  }

  private base64Url(value: string) {
    return Buffer.from(value).toString('base64url');
  }

  /** 固定时间比较，避免签名比较时产生时序攻击侧信道。 */
  private safeEqual(a: string, b: string) {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    if (left.length !== right.length) return false;
    return timingSafeEqual(left, right);
  }
}
