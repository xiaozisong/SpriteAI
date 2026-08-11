import type { OAuthProfile } from '../auth.types';
export declare class WechatOAuthProvider {
    createAuthorizeUrl(state: string, callbackUrl: string): string;
    exchangeCode(code: string, callbackUrl: string): Promise<OAuthProfile>;
    private fetchJson;
}
