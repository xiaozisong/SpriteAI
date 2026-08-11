import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { EmailOtpProvider } from './providers/email-otp.provider';
import { QqOAuthProvider } from './providers/qq-oauth.provider';
import { WechatOAuthProvider } from './providers/wechat-oauth.provider';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/**
 * AuthModule 是认证能力的聚合模块。
 *
 * NestJS 推荐按业务域拆 Module：
 * - Controller 暴露 HTTP 接口
 * - Service 承载业务逻辑
 * - Provider 对接外部平台
 * - Guard 保护需要登录的接口
 *
 * 这样其他模块只需要 import AuthModule，就可以复用认证能力。
 */
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    EmailOtpProvider,
    QqOAuthProvider,
    WechatOAuthProvider,
    JwtAuthGuard,
  ],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
