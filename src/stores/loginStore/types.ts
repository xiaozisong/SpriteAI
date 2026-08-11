import type { GuideTask } from '@/api/users'

export interface UserInfo {
  id: string
  createdTime?: string
  /** 旧业务仍可能读取 phone；新登录方式不强制手机号。 */
  phone?: string
  /** 邮箱验证码登录会返回 email；QQ/微信登录可能为空。 */
  email?: string | null
  nickName: string
  /** QQ/微信资料里可能带头像。 */
  avatarUrl?: string | null
  limitStatus?: number
}

export interface AvatarData {
  color: { r: number; g: number; b: number }
  hash: number
}

export interface Message {
  id: string | number
  title: string
  desc: string
  content: string
  timestamp: string
  isReaded: boolean
}

export type InterceptedAction = (...args: any[]) => void | Promise<void>

export interface LoginState {
  isLoggedIn: boolean
  userInfo: UserInfo | null
  isLoading: boolean
  smsCountdown: number
  messages: Message[]
  readedMessageIds: string[]
  messagePage: number
  messagePageSize: number
  hasMoreMessages: boolean
  isLoadingMessages: boolean
  hasNewbieTourShowed: boolean
  interceptedActions: InterceptedAction[]
  /** 递增即表示请求打开登录弹窗 */
  loginDialogRequest: number
  sendIdeaTourShow: boolean
  missionGroup: GuideTask[]
  dailyBalance: number
  dailyBalanceLimit: number
  fixedBalance: number
  isLoadingBalance: boolean
}

export interface LoginActions {
  setNewbieTourShowed: () => void
  updateLoginStatus: () => void
  saveUserInfo: (info: UserInfo | null) => void
  loadUserInfo: () => UserInfo | null
  saveReadedMessageIds: (ids: string[]) => void
  markMessageAsRead: (messageId: string | number) => void
  updateMessages: () => Promise<Message[]>
  loadMoreMessages: () => Promise<void>
  /** 发送 QQ 邮箱 / Gmail 验证码。 */
  sendEmailCode: (email: string) => Promise<{ success: boolean; message: string }>
  /** 使用邮箱 + 6 位验证码完成登录。 */
  loginWithEmailCode: (email: string, code: string) => Promise<{ success: boolean; message: string }>
  /** 兼容旧 ticket 登录入口，内部转到 OAuth ticket 交换。 */
  loginWithTicket: (ticket: string) => Promise<{ success: boolean; message: string }>
  /** 获取 QQ/微信授权 URL 并跳转。 */
  startOAuthLogin: (provider: 'qq' | 'wechat') => Promise<void>
  /** OAuth 回调页用一次性 ticket 换 token。 */
  handleOAuthCallback: (ticket: string) => Promise<{ success: boolean; message: string }>
  /** 页面刷新后用 token 恢复当前用户信息。 */
  fetchCurrentUser: () => Promise<UserInfo | null>
  logout: () => Promise<void>
  initUserInfo: () => void
  requireLogin: <T extends any[]>(action: (...args: T) => void | Promise<void>, ...args: T) => Promise<void>
  clearInterceptedActions: () => void
  executeInterceptedActions: () => Promise<void>
  consumeLoginDialogRequest: () => number
  makeRandomAvatar: (token: string) => AvatarData
  renderAvatarFromData: (avatarData: AvatarData, pixelSize?: number, size?: number) => string
  setSendIdeaTourShow: (show: boolean) => void
  refreshBalance: () => Promise<void>
  updateNewbieMission: () => Promise<void>
  completeNewbieMissionByCode: (code: string) => Promise<boolean>
  getNewbieMissionProgressPercent: () => string
}

export type LoginStore = LoginState & LoginActions
