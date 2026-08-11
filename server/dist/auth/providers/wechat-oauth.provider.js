"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WechatOAuthProvider = void 0;
const common_1 = require("@nestjs/common");
let WechatOAuthProvider = class WechatOAuthProvider {
    createAuthorizeUrl(state, callbackUrl) {
        const clientId = process.env.WECHAT_CLIENT_ID;
        if (!clientId)
            throw new common_1.BadRequestException('微信登录尚未配置');
        const params = new URLSearchParams({
            appid: clientId,
            redirect_uri: callbackUrl,
            response_type: 'code',
            scope: 'snsapi_login',
            state,
        });
        return `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`;
    }
    async exchangeCode(code, callbackUrl) {
        const clientId = process.env.WECHAT_CLIENT_ID;
        const clientSecret = process.env.WECHAT_CLIENT_SECRET;
        if (!clientId || !clientSecret)
            throw new common_1.BadRequestException('微信登录尚未配置');
        const tokenParams = new URLSearchParams({
            appid: clientId,
            secret: clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: callbackUrl,
        });
        const tokenRes = await this.fetchJson(`https://api.weixin.qq.com/sns/oauth2/access_token?${tokenParams.toString()}`);
        if (!tokenRes.access_token || !tokenRes.openid) {
            throw new common_1.BadRequestException(tokenRes.errmsg || '微信登录失败');
        }
        const userParams = new URLSearchParams({
            access_token: tokenRes.access_token,
            openid: tokenRes.openid,
            lang: 'zh_CN',
        });
        const userInfo = await this.fetchJson(`https://api.weixin.qq.com/sns/userinfo?${userParams.toString()}`);
        return {
            provider: 'wechat',
            providerUserId: userInfo.unionid || tokenRes.unionid || tokenRes.openid,
            unionId: userInfo.unionid || tokenRes.unionid,
            nickname: userInfo.nickname,
            avatarUrl: userInfo.headimgurl,
        };
    }
    async fetchJson(url) {
        const response = await fetch(url);
        if (!response.ok)
            throw new common_1.BadRequestException('微信登录失败');
        return response.json();
    }
};
exports.WechatOAuthProvider = WechatOAuthProvider;
exports.WechatOAuthProvider = WechatOAuthProvider = __decorate([
    (0, common_1.Injectable)()
], WechatOAuthProvider);
//# sourceMappingURL=wechat-oauth.provider.js.map