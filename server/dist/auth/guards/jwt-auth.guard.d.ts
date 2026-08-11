import { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth.service';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email?: string | null;
    };
}
export declare class JwtAuthGuard implements CanActivate {
    private readonly authService;
    constructor(authService: AuthService);
    canActivate(context: ExecutionContext): boolean;
    private extractBearerToken;
}
