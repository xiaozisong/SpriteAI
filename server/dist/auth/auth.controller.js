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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    sendEmailCode(dto, req) {
        return this.authService.sendEmailCode(dto.email, this.getIp(req));
    }
    verifyEmailCode(dto, req) {
        return this.authService.verifyEmailCode(dto.email, dto.code, this.getMeta(req));
    }
    getOAuthUrl(query) {
        return this.authService.createOAuthAuthorizeUrl(query.provider, query.redirectTo);
    }
    async oauthCallback(provider, code, state, res) {
        const webUrl = (process.env.AUTH_PUBLIC_WEB_URL || 'http://localhost:5173').replace(/\/+$/, '');
        try {
            const result = await this.authService.handleOAuthCallback(provider, code, state);
            const params = new URLSearchParams({
                ticket: result.ticket,
                redirectTo: result.redirectTo,
            });
            return res.redirect(`${webUrl}/auth/callback?${params.toString()}`);
        }
        catch (error) {
            const params = new URLSearchParams({
                error: error instanceof Error ? error.message : '登录失败',
            });
            return res.redirect(`${webUrl}/auth/callback?${params.toString()}`);
        }
    }
    exchangeTicket(dto, req) {
        return this.authService.exchangeLoginTicket(dto.ticket, this.getMeta(req));
    }
    me(req) {
        return this.authService.getMe(req.user.id);
    }
    logout() {
        return { success: true };
    }
    getMeta(req) {
        return {
            userAgent: req.headers['user-agent'],
            ipAddress: this.getIp(req),
        };
    }
    getIp(req) {
        return req.ip || req.socket.remoteAddress;
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('email/send-code'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.SendEmailCodeDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "sendEmailCode", null);
__decorate([
    (0, common_1.Post)('email/verify-code'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.VerifyEmailCodeDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyEmailCode", null);
__decorate([
    (0, common_1.Get)('oauth/url'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.OAuthUrlDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getOAuthUrl", null);
__decorate([
    (0, common_1.Get)('oauth/:provider/callback'),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Query)('code')),
    __param(2, (0, common_1.Query)('state')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "oauthCallback", null);
__decorate([
    (0, common_1.Post)('oauth/exchange-ticket'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ExchangeLoginTicketDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "exchangeTicket", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.Post)('logout'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('api/auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map