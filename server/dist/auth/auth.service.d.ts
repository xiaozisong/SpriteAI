import type { Db } from '../db/types';
import { EmailOtpProvider } from './providers/email-otp.provider';
import { QqOAuthProvider } from './providers/qq-oauth.provider';
import { WechatOAuthProvider } from './providers/wechat-oauth.provider';
import { TokenService } from './token.service';
import type { AuthUser, OAuthProvider } from './auth.types';
export declare class AuthService {
    private readonly db;
    private readonly emailOtpProvider;
    private readonly qqOAuthProvider;
    private readonly wechatOAuthProvider;
    private readonly tokenService;
    constructor(db: Db, emailOtpProvider: EmailOtpProvider, qqOAuthProvider: QqOAuthProvider, wechatOAuthProvider: WechatOAuthProvider, tokenService: TokenService);
    sendEmailCode(email: string, ipAddress?: string): Promise<{
        message: string;
    }>;
    verifyEmailCode(email: string, code: string, meta?: RequestMeta): Promise<{
        token: string;
        refreshToken: string;
        user: AuthUser;
    }>;
    createOAuthAuthorizeUrl(provider: OAuthProvider, redirectTo?: string): Promise<{
        url: string;
    }>;
    handleOAuthCallback(provider: OAuthProvider, code: string, state: string): Promise<{
        ticket: string;
        redirectTo: string;
    }>;
    exchangeLoginTicket(ticket: string, meta?: RequestMeta): Promise<{
        token: string;
        refreshToken: string;
        user: AuthUser;
    }>;
    getMe(userId: string): Promise<AuthUser>;
    verifyAccessToken(token: string): import("./token.service").TokenPayload;
    private findOrCreateEmailUser;
    private findOrCreateOAuthUser;
    private issueLogin;
    private createLoginTicket;
    private getOAuthProvider;
    private assertOAuthProvider;
    private getOAuthCallbackUrl;
    private normalizeEmail;
    private assertSupportedEmail;
    private hashCode;
    private safeRedirectPath;
    private toAuthUser;
}
export interface RequestMeta {
    userAgent?: string;
    ipAddress?: string;
}
