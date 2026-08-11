import { BadRequestException, Injectable } from '@nestjs/common';
import type { OAuthProfile } from '../auth.types';

@Injectable()
export class WechatOAuthProvider {
  /**
   * 生成微信开放平台扫码登录地址。
   *
   * 网站扫码登录使用 snsapi_login scope；
   * state 由后端生成并落库，用来防止伪造回调。
   */
  createAuthorizeUrl(state: string, callbackUrl: string) {
    const clientId = process.env.WECHAT_CLIENT_ID;
    if (!clientId) throw new BadRequestException('微信登录尚未配置');

    const params = new URLSearchParams({
      appid: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'snsapi_login',
      state,
    });
    return `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`;
  }

  /**
   * 微信 OAuth 回调后，用 code 换 access_token，并获取用户资料。
   *
   * 微信 unionid 能跨同主体应用识别同一个用户，优先级高于 openid；
   * 如果平台没有返回 unionid，则用 openid 兜底。
   */
  async exchangeCode(code: string, callbackUrl: string): Promise<OAuthProfile> {
    const clientId = process.env.WECHAT_CLIENT_ID;
    const clientSecret = process.env.WECHAT_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new BadRequestException('微信登录尚未配置');

    const tokenParams = new URLSearchParams({
      appid: clientId,
      secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: callbackUrl,
    });
    const tokenRes = await this.fetchJson<{
      access_token?: string;
      openid?: string;
      unionid?: string;
      errmsg?: string;
    }>(`https://api.weixin.qq.com/sns/oauth2/access_token?${tokenParams.toString()}`);

    if (!tokenRes.access_token || !tokenRes.openid) {
      throw new BadRequestException(tokenRes.errmsg || '微信登录失败');
    }

    const userParams = new URLSearchParams({
      access_token: tokenRes.access_token,
      openid: tokenRes.openid,
      lang: 'zh_CN',
    });
    const userInfo = await this.fetchJson<{
      nickname?: string;
      headimgurl?: string;
      unionid?: string;
      errmsg?: string;
    }>(`https://api.weixin.qq.com/sns/userinfo?${userParams.toString()}`);

    return {
      provider: 'wechat',
      providerUserId: userInfo.unionid || tokenRes.unionid || tokenRes.openid,
      unionId: userInfo.unionid || tokenRes.unionid,
      nickname: userInfo.nickname,
      avatarUrl: userInfo.headimgurl,
    };
  }

  /** 封装微信接口请求，统一把平台请求失败转换成业务可读错误。 */
  private async fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) throw new BadRequestException('微信登录失败');
    return response.json() as Promise<T>;
  }
}
