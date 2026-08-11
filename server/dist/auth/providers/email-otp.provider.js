"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EmailOtpProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailOtpProvider = void 0;
const common_1 = require("@nestjs/common");
let EmailOtpProvider = EmailOtpProvider_1 = class EmailOtpProvider {
    logger = new common_1.Logger(EmailOtpProvider_1.name);
    async sendCode(email, code) {
        const hasSmtpConfig = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
        if (!hasSmtpConfig) {
            this.logger.warn(`SMTP 未配置，开发环境验证码：${email} -> ${code}`);
            return;
        }
        this.logger.warn(`SMTP 配置已存在，但发送实现待接入：${email} -> ${code}`);
    }
};
exports.EmailOtpProvider = EmailOtpProvider;
exports.EmailOtpProvider = EmailOtpProvider = EmailOtpProvider_1 = __decorate([
    (0, common_1.Injectable)()
], EmailOtpProvider);
//# sourceMappingURL=email-otp.provider.js.map