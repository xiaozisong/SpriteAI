import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ExchangeLoginTicketDto, OAuthUrlDto, SendEmailCodeDto, VerifyEmailCodeDto } from './dto';
import { type AuthenticatedRequest } from './guards/jwt-auth.guard';
import type { OAuthProvider } from './auth.types';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    sendEmailCode(dto: SendEmailCodeDto, req: Request): Promise<{
        message: string;
    }>;
    verifyEmailCode(dto: VerifyEmailCodeDto, req: Request): Promise<{
        token: string;
        refreshToken: string;
        user: import("./auth.types").AuthUser;
    }>;
    getOAuthUrl(query: OAuthUrlDto): Promise<{
        url: string;
    }>;
    oauthCallback(provider: OAuthProvider, code: string, state: string, res: Response): Promise<void>;
    exchangeTicket(dto: ExchangeLoginTicketDto, req: Request): Promise<{
        token: string;
        refreshToken: string;
        user: import("./auth.types").AuthUser;
    }>;
    me(req: AuthenticatedRequest): Promise<import("./auth.types").AuthUser>;
    logout(): {
        success: boolean;
    };
    private getMeta;
    private getIp;
}
