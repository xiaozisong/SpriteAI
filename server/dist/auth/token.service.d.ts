export interface TokenPayload {
    sub: string;
    email?: string | null;
    exp: number;
    iat: number;
}
export declare class TokenService {
    private get secret();
    signAccessToken(payload: Omit<TokenPayload, 'exp' | 'iat'>): string;
    verifyAccessToken(token: string): TokenPayload;
    createOpaqueToken(bytes?: number): string;
    hashOpaqueToken(token: string): string;
    private sign;
    private base64Url;
    private safeEqual;
}
