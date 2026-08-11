"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let TokenService = class TokenService {
    get secret() {
        return process.env.JWT_SECRET || 'change-me-in-production';
    }
    signAccessToken(payload) {
        const now = Math.floor(Date.now() / 1000);
        const ttl = Number(process.env.JWT_ACCESS_TOKEN_TTL_SECONDS || 7200);
        const body = {
            ...payload,
            iat: now,
            exp: now + ttl,
        };
        const header = this.base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const encodedPayload = this.base64Url(JSON.stringify(body));
        const signature = this.sign(`${header}.${encodedPayload}`);
        return `${header}.${encodedPayload}.${signature}`;
    }
    verifyAccessToken(token) {
        const [header, payload, signature] = token.split('.');
        if (!header || !payload || !signature) {
            throw new common_1.UnauthorizedException('登录已过期，请重新登录');
        }
        const expected = this.sign(`${header}.${payload}`);
        if (!this.safeEqual(signature, expected)) {
            throw new common_1.UnauthorizedException('登录已过期，请重新登录');
        }
        const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
            throw new common_1.UnauthorizedException('登录已过期，请重新登录');
        }
        return decoded;
    }
    createOpaqueToken(bytes = 32) {
        return (0, crypto_1.randomBytes)(bytes).toString('base64url');
    }
    hashOpaqueToken(token) {
        return (0, crypto_1.createHmac)('sha256', this.secret).update(token).digest('hex');
    }
    sign(value) {
        return (0, crypto_1.createHmac)('sha256', this.secret).update(value).digest('base64url');
    }
    base64Url(value) {
        return Buffer.from(value).toString('base64url');
    }
    safeEqual(a, b) {
        const left = Buffer.from(a);
        const right = Buffer.from(b);
        if (left.length !== right.length)
            return false;
        return (0, crypto_1.timingSafeEqual)(left, right);
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = __decorate([
    (0, common_1.Injectable)()
], TokenService);
//# sourceMappingURL=token.service.js.map