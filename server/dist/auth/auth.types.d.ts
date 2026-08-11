export type OAuthProvider = 'qq' | 'wechat';
export interface AuthUser {
    id: string;
    email: string | null;
    nickName: string;
    avatarUrl?: string | null;
}
export interface OAuthProfile {
    provider: OAuthProvider;
    providerUserId: string;
    unionId?: string | null;
    email?: string | null;
    nickname?: string | null;
    avatarUrl?: string | null;
}
