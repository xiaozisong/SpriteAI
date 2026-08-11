import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ExchangeLoginTicketDto, OAuthUrlDto, SendEmailCodeDto, VerifyEmailCodeDto } from './dto';
import { JwtAuthGuard, type AuthenticatedRequest } from './guards/jwt-auth.guard';
import type { OAuthProvider } from './auth.types';

/**
 * AuthController 是 HTTP 接口层。
 *
 * 设计原则：
 * - Controller 只负责“接请求、取参数、返回响应/重定向”
 * - 具体业务规则放到 AuthService，避免控制器变得臃肿
 * - OAuth 回调需要使用 @Res() 主动重定向，所以这部分保留在 Controller
 */
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** 发送邮箱验证码：前端传 email，后端负责域名校验、限流和发送。 */
  @Post('email/send-code')
  sendEmailCode(@Body() dto: SendEmailCodeDto, @Req() req: Request) {
    return this.authService.sendEmailCode(dto.email, this.getIp(req));
  }

  /** 校验邮箱验证码：成功后返回系统自己的 token，而不是邮箱服务的凭证。 */
  @Post('email/verify-code')
  verifyEmailCode(@Body() dto: VerifyEmailCodeDto, @Req() req: Request) {
    return this.authService.verifyEmailCode(dto.email, dto.code, this.getMeta(req));
  }

  /** 获取 QQ/微信授权 URL：后端生成 state，前端只负责跳转。 */
  @Get('oauth/url')
  getOAuthUrl(@Query() query: OAuthUrlDto) {
    return this.authService.createOAuthAuthorizeUrl(query.provider, query.redirectTo);
  }

  /**
   * OAuth 回调入口。
   *
   * QQ/微信平台会带 code 和 state 回调这个接口。
   * 这里不直接把系统 token 放到 URL，而是生成一次性 ticket 后重定向前端，
   * 避免 token 出现在浏览器历史、日志或 Referer 中。
   */
  @Get('oauth/:provider/callback')
  async oauthCallback(
    @Param('provider') provider: OAuthProvider,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const webUrl = (process.env.AUTH_PUBLIC_WEB_URL || 'http://localhost:5173').replace(/\/+$/, '');
    try {
      const result = await this.authService.handleOAuthCallback(provider, code, state);
      const params = new URLSearchParams({
        ticket: result.ticket,
        redirectTo: result.redirectTo,
      });
      return res.redirect(`${webUrl}/auth/callback?${params.toString()}`);
    } catch (error) {
      const params = new URLSearchParams({
        error: error instanceof Error ? error.message : '登录失败',
      });
      return res.redirect(`${webUrl}/auth/callback?${params.toString()}`);
    }
  }

  /** 前端拿一次性 ticket 换系统 token。ticket 被消费后会立即失效。 */
  @Post('oauth/exchange-ticket')
  exchangeTicket(@Body() dto: ExchangeLoginTicketDto, @Req() req: Request) {
    return this.authService.exchangeLoginTicket(dto.ticket, this.getMeta(req));
  }

  /** 当前登录用户信息示例接口。后续业务接口也可以复用 JwtAuthGuard。 */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: AuthenticatedRequest) {
    return this.authService.getMe(req.user!.id);
  }

  /** 当前 logout 只返回成功；真正清理本地 token 在前端完成。 */
  @Post('logout')
  logout() {
    return { success: true };
  }

  /** 收集 user-agent 和 IP，便于后续做 session 管理、风控、审计。 */
  private getMeta(req: Request) {
    return {
      userAgent: req.headers['user-agent'],
      ipAddress: this.getIp(req),
    };
  }

  /** Express 在代理部署时可能需要 trust proxy，生产环境要统一网关配置。 */
  private getIp(req: Request) {
    return req.ip || req.socket.remoteAddress;
  }
}
