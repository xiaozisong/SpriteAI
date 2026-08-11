"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeLoginTicketDto = exports.OAuthUrlDto = exports.VerifyEmailCodeDto = exports.SendEmailCodeDto = void 0;
const class_validator_1 = require("class-validator");
class SendEmailCodeDto {
    email;
}
exports.SendEmailCodeDto = SendEmailCodeDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SendEmailCodeDto.prototype, "email", void 0);
class VerifyEmailCodeDto {
    email;
    code;
}
exports.VerifyEmailCodeDto = VerifyEmailCodeDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], VerifyEmailCodeDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 6),
    __metadata("design:type", String)
], VerifyEmailCodeDto.prototype, "code", void 0);
class OAuthUrlDto {
    provider;
    redirectTo;
}
exports.OAuthUrlDto = OAuthUrlDto;
__decorate([
    (0, class_validator_1.IsIn)(['qq', 'wechat']),
    __metadata("design:type", String)
], OAuthUrlDto.prototype, "provider", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OAuthUrlDto.prototype, "redirectTo", void 0);
class ExchangeLoginTicketDto {
    ticket;
}
exports.ExchangeLoginTicketDto = ExchangeLoginTicketDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExchangeLoginTicketDto.prototype, "ticket", void 0);
//# sourceMappingURL=dto.js.map