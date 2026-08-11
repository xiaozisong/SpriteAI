"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QqOAuthProvider = void 0;
const common_1 = require("@nestjs/common");
let QqOAuthProvider = class QqOAuthProvider {
    createAuthorizeUrl(state, callbackUrl) {
        const clientId = process.env.QQ_CLIENT_ID;
        if (!clientId)
            throw new common_1.BadRequestException('QQ 登录尚未配置');
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: callbackUrl,
            state,
        });
        return `https://graph.qq.com/oauth2.0/authorize?${params.toString()}`;
    }
    async exchangeCode(code, callbackUrl) {
        const clientId = process.env.QQ_CLIENT_ID;
        const clientSecret = process.env.QQ_CLIENT_SECRET;
        if (!clientId || !clientSecret)
            throw new common_1.BadRequestException('QQ 登录尚未配置');
        const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: callbackUrl,
            fmt: 'json',
        });
        const tokenRes = await this.fetchJson(`https://graph.qq.com/oauth2.0/token?${tokenParams.toString()}`);
        if (!tokenRes.access_token) {
            throw new common_1.BadRequestException(tokenRes.error_description || 'QQ 登录失败');
        }
        const openIdText = await fetch(`https://graph.qq.com/oauth2.0/me?access_token=${encodeURIComponent(tokenRes.access_token)}&fmt=json`).then((res) => res.text());
        const openIdJson = this.parseJsonp(openIdText);
        if (!openIdJson.openid) {
            throw new common_1.BadRequestException(openIdJson.error_description || 'QQ 登录失败');
        }
        const userParams = new URLSearchParams({
            access_token: tokenRes.access_token,
            oauth_consumer_key: clientId,
            openid: openIdJson.openid,
            fmt: 'json',
        });
        const userInfo = await this.fetchJson(`https://graph.qq.com/user/get_user_info?${userParams.toString()}`);
        return {
            provider: 'qq',
            providerUserId: openIdJson.openid,
            nickname: userInfo.nickname,
            avatarUrl: userInfo.figureurl_qq_2 || userInfo.figureurl_qq_1,
        };
    }
    async fetchJson(url) {
        const response = await fetch(url);
        if (!response.ok)
            throw new common_1.BadRequestException('QQ 登录失败');
        return response.json();
    }
    parseJsonp(text) {
        const json = text.replace(/^callback\(\s*/, '').replace(/\s*\);?$/, '');
        return JSON.parse(json);
    }
};
exports.QqOAuthProvider = QqOAuthProvider;
exports.QqOAuthProvider = QqOAuthProvider = __decorate([
    (0, common_1.Injectable)()
], QqOAuthProvider);
//# sourceMappingURL=qq-oauth.provider.js.map