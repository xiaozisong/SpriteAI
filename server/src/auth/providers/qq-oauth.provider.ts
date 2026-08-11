import { BadRequestException, Injectable } from '@nestjs/common';
import type { OAuthProfile } from '../auth.types';

@Injectable()
export class QqOAuthProvider {
  /**
   * 生成 QQ 互联授权地址。
   *
   * state 由后端生成并落库，用来防止 CSRF；
   * callbackUrl 必须和 QQ 互联后台配置的回调地址一致。
   */
  createAuthorizeUrl(state: string, callbackUrl: string) {
    const clientId = process.env.QQ_CLIENT_ID;
    if (!clientId) throw new BadRequestException('QQ 登录尚未配置');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: callbackUrl,
      state,
    });
    return `https://graph.qq.com/oauth2.0/authorize?${params.toString()}`;
  }

  /**
   * QQ OAuth 回调后，用 code 换 access_token，再拿 openid 和用户资料。
   *
   * 注意：QQ 的 openid 是当前应用下的用户唯一标识，
   * 所以后续用 provider + openid 写入 auth_identities。
   */
  async exchangeCode(code: string, callbackUrl: string): Promise<OAuthProfile> {
    const clientId = process.env.QQ_CLIENT_ID;
    const clientSecret = process.env.QQ_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new BadRequestException('QQ 登录尚未配置');

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: callbackUrl,
      fmt: 'json',
    });
    const tokenRes = await this.fetchJson<{ access_token?: string; error_description?: string }>(
      `https://graph.qq.com/oauth2.0/token?${tokenParams.toString()}`,
    );
    if (!tokenRes.access_token) {
      throw new BadRequestException(tokenRes.error_description || 'QQ 登录失败');
    }

    const openIdText = await fetch(
      `https://graph.qq.com/oauth2.0/me?access_token=${encodeURIComponent(tokenRes.access_token)}&fmt=json`,
    ).then((res) => res.text());
    const openIdJson = this.parseJsonp<{ openid?: string; error_description?: string }>(openIdText);
    if (!openIdJson.openid) {
      throw new BadRequestException(openIdJson.error_description || 'QQ 登录失败');
    }

    const userParams = new URLSearchParams({
      access_token: tokenRes.access_token,
      oauth_consumer_key: clientId,
      openid: openIdJson.openid,
      fmt: 'json',
    });
    const userInfo = await this.fetchJson<{ nickname?: string; figureurl_qq_2?: string; figureurl_qq_1?: string }>(
      `https://graph.qq.com/user/get_user_info?${userParams.toString()}`,
    );

    return {
      provider: 'qq',
      providerUserId: openIdJson.openid,
      nickname: userInfo.nickname,
      avatarUrl: userInfo.figureurl_qq_2 || userInfo.figureurl_qq_1,
    };
  }

  /** QQ 大部分接口可返回 JSON，统一封装错误处理，避免 Service 感知平台细节。 */
  private async fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) throw new BadRequestException('QQ 登录失败');
    return response.json() as Promise<T>;
  }

  /** QQ openid 接口历史上常返回 callback(...) 包裹格式，这里做兼容解析。 */
  private parseJsonp<T>(text: string): T {
    const json = text.replace(/^callback\(\s*/, '').replace(/\s*\);?$/, '');
    return JSON.parse(json) as T;
  }
}
