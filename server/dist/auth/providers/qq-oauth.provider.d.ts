import type { OAuthProfile } from '../auth.types';
export declare class QqOAuthProvider {
    createAuthorizeUrl(state: string, callbackUrl: string): string;
    exchangeCode(code: string, callbackUrl: string): Promise<OAuthProfile>;
    private fetchJson;
    private parseJsonp;
}
