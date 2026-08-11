import { IsEmail, IsIn, IsOptional, IsString, Length } from 'class-validator';

/**
 * DTO 用来声明接口入参结构，并配合全局 ValidationPipe 做自动校验。
 *
 * 好处：
 * - Controller 不需要手写大量 if 校验
 * - 非法参数不会进入 Service
 * - 前后端能通过 DTO 快速理解接口契约
 */
export class SendEmailCodeDto {
  @IsEmail()
  email!: string;
}

/** 邮箱验证码登录入参：验证码固定 6 位，和前端输入框保持一致。 */
export class VerifyEmailCodeDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}

/** 获取第三方授权 URL 的入参。redirectTo 用来登录后回到原页面。 */
export class OAuthUrlDto {
  @IsIn(['qq', 'wechat'])
  provider!: 'qq' | 'wechat';

  @IsOptional()
  @IsString()
  redirectTo?: string;
}

/** OAuth 回调后，前端用一次性 ticket 换系统 token。 */
export class ExchangeLoginTicketDto {
  @IsString()
  ticket!: string;
}
