import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth.service';

/** 通过 Guard 校验后，Controller 可以从 req.user 读取当前登录用户。 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string | null;
  };
}

/**
 * JwtAuthGuard 是接口保护层。
 *
 * 用法：
 *   @UseGuards(JwtAuthGuard)
 *   @Get('me')
 *
 * 它的职责不是查询业务数据，而是统一处理“这个请求有没有登录”。
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);
    const payload = this.authService.verifyAccessToken(token);
    // 把 token 中的用户身份挂到 request，后续 Controller/Service 就不用重复解析 token。
    request.user = {
      id: payload.sub,
      email: payload.email,
    };
    return true;
  }

  /** 统一要求前端使用 Authorization: Bearer <token>。 */
  private extractBearerToken(request: Request) {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('请先登录');
    }
    return authHeader.slice('Bearer '.length);
  }
}
