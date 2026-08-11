import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailOtpProvider {
  private readonly logger = new Logger(EmailOtpProvider.name);

  /**
   * 邮件发送适配器。
   *
   * AuthService 只关心“发送验证码”这个动作，不关心底层是 SMTP、SendCloud、
   * Resend 还是其他邮件 API。这样后续替换邮件服务时，只需要改这个 Provider。
   */
  async sendCode(email: string, code: string) {
    const hasSmtpConfig = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);

    if (!hasSmtpConfig) {
      this.logger.warn(`SMTP 未配置，开发环境验证码：${email} -> ${code}`);
      return;
    }

    // 当前实现不引入额外依赖，生产接入时可在此替换为 SMTP/邮件 API SDK。
    this.logger.warn(`SMTP 配置已存在，但发送实现待接入：${email} -> ${code}`);
  }
}
