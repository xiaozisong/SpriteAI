/** 当前支持的第三方 OAuth Provider。邮箱登录不走 OAuth，所以不放在这里。 */
export type OAuthProvider = 'qq' | 'wechat';

/** 返回给前端的用户结构，字段名兼容现有前端 userInfo.nickName 用法。 */
export interface AuthUser {
  id: string;
  email: string | null;
  nickName: string;
  avatarUrl?: string | null;
}

/** QQ/微信 Provider 归一化后的第三方用户资料。 */
export interface OAuthProfile {
  provider: OAuthProvider;
  providerUserId: string;
  unionId?: string | null;
  email?: string | null;
  nickname?: string | null;
  avatarUrl?: string | null;
}
