import apiClient from './index'
import type { UserInfo } from '@/stores/loginStore/types'

/** 前端当前支持的第三方扫码登录渠道。 */
export type OAuthProvider = 'qq' | 'wechat'

/** 后端登录成功后返回的统一结构，所有登录方式都归一到这个结果。 */
export interface LoginResult {
  token: string
  refreshToken?: string
  user: UserInfo
}

/** 请求后端发送邮箱验证码。后端会限制只允许 QQ 邮箱和 Gmail。 */
export const sendEmailCodeReq = (email: string) => {
  return apiClient.post<{ message: string }>('/api/auth/email/send-code', { email })
}

/** 使用邮箱验证码登录，成功后返回系统自己的 token。 */
export const verifyEmailCodeReq = (email: string, code: string) => {
  return apiClient.post<LoginResult>('/api/auth/email/verify-code', { email, code })
}

/**
 * 获取 QQ/微信 OAuth 授权地址。
 * redirectTo 用来登录完成后回到用户原本所在页面。
 */
export const getOAuthUrlReq = (provider: OAuthProvider, redirectTo: string = window.location.pathname) => {
  return apiClient.get<{ url: string }>('/api/auth/oauth/url', { provider, redirectTo })
}

/** OAuth 回调页拿到一次性 ticket 后，用这个接口换 token。 */
export const exchangeOAuthTicketReq = (ticket: string) => {
  return apiClient.post<LoginResult>('/api/auth/oauth/exchange-ticket', { ticket })
}

/** 获取当前登录用户，常用于页面刷新后恢复 userInfo。 */
export const getCurrentUserReq = () => {
  return apiClient.get<UserInfo>('/api/auth/me')
}

/** 退出登录的服务端通知；本地 token 清理在 loginStore.logout 中完成。 */
export const logoutReq = () => {
  return apiClient.post<{ success: boolean }>('/api/auth/logout')
}
