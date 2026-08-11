import { useCallback, useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog'
import { useLoginStore } from '@/stores/loginStore'
import { toast } from "sonner";
import { cn } from '@/lib/utils'
import { Button } from "@/components/ui/Button.tsx";

export interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoginSuccess?: () => void
  onLoginFailed?: () => void
}

/**
 * 自有登录弹窗。
 *
 * 这个组件只负责 UI 和用户交互：
 * - 邮箱、验证码、协议勾选
 * - 触发 QQ / 微信扫码登录
 * - 展示倒计时和错误提示
 *
 * 真正的登录请求和 token 保存放在 loginStore，避免弹窗和认证业务强耦合。
 */
export const LoginDialog = ({ open, onOpenChange, onLoginSuccess, onLoginFailed }: LoginDialogProps) => {
  const sendEmailCode = useLoginStore((s) => s.sendEmailCode)
  const loginWithEmailCode = useLoginStore((s) => s.loginWithEmailCode)
  const startOAuthLogin = useLoginStore((s) => s.startOAuthLogin)
  const isLoading = useLoginStore((s) => s.isLoading)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [countdown, setCountdown] = useState(0)

  /** 验证码发送后的 60 秒倒计时，只控制前端按钮状态，真正限流仍由后端保证。 */
  useEffect(() => {
    if (countdown <= 0) return
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown])

  const ensureAgreement = useCallback(() => {
    if (agreed) return true
    toast.error('请先阅读并同意用户协议和隐私政策')
    return false
  }, [agreed])

  /** 发送验证码：前端做空值和协议校验，邮箱域名和频率限制由后端做最终判断。 */
  const handleSendCode = useCallback(async () => {
    if (!ensureAgreement()) return
    if (!email.trim()) {
      toast.error('请输入邮箱')
      return
    }
    const result = await sendEmailCode(email)
    if (result.success) {
      toast.success(result.message)
      setCountdown(60)
      return
    }
    toast.error(result.message)
  }, [email, ensureAgreement, sendEmailCode])

  /** 邮箱登录：验证码正确后 loginStore 会保存 token 和 userInfo。 */
  const handleEmailLogin = useCallback(async () => {
    if (!ensureAgreement()) return
    if (!email.trim()) {
      toast.error('请输入邮箱')
      return
    }
    if (!code.trim()) {
      toast.error('请输入验证码')
      return
    }
    const result = await loginWithEmailCode(email, code)
    if (result.success) {
      toast.success('登录成功')
      onLoginSuccess?.()
      onOpenChange(false)
      return
    }
    toast.error(result.message)
    onLoginFailed?.()
  }, [code, email, ensureAgreement, loginWithEmailCode, onLoginFailed, onLoginSuccess, onOpenChange])

  /** 第三方扫码登录会离开当前页面，授权完成后由 /auth/callback 接住。 */
  const handleOAuthLogin = useCallback(async (provider: 'qq' | 'wechat') => {
    if (!ensureAgreement()) return
    try {
      await startOAuthLogin(provider)
    } catch (error: any) {
      toast.error(error?.message || '登录失败，请重试')
      onLoginFailed?.()
    }
  }, [ensureAgreement, onLoginFailed, startOAuthLogin])

  /** 登录弹窗用于强制登录场景，默认禁止点击遮罩或 ESC 关闭。 */
  const preventClose = useCallback((e: Event) => {
    e.preventDefault()
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          'gap-0 overflow-hidden boom_claw_login_dialog p-0',
          'w-120 max-w-[calc(100vw-2rem)] border border-white/10 bg-[#0b1020] text-white',
        )}
        onInteractOutside={preventClose}
        onEscapeKeyDown={preventClose}
      >
        <div className="relative flex w-full flex-col gap-6 px-8 py-8">
          <div className="space-y-2">
            <DialogTitle className="text-2xl font-semibold text-white">登录精灵</DialogTitle>
            <p className="text-sm leading-6 text-white/55">
              支持 QQ 邮箱、Gmail 验证码登录，也可以使用 QQ 或微信扫码登录。
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm text-white/70">邮箱</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="请输入 QQ 邮箱或 Gmail"
              className="h-11 w-full rounded-xl border border-white/10 bg-white/6 px-4 text-sm text-white outline-none transition focus:border-[#94A9FF]/70"
            />
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="6 位验证码"
                maxLength={6}
                className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/6 px-4 text-sm text-white outline-none transition focus:border-[#94A9FF]/70"
              />
              <Button
                type="button"
                disabled={isLoading || countdown > 0}
                onClick={handleSendCode}
                className="h-11 min-w-28 rounded-xl bg-white/10 px-4 text-sm text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {countdown > 0 ? `${countdown}s` : '获取验证码'}
              </Button>
            </div>
            <Button
              type="button"
              disabled={isLoading}
              onClick={handleEmailLogin}
              className="h-11 w-full rounded-xl bg-[#94A9FF] text-sm font-medium text-[#081024] hover:bg-[#A8B8FF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              邮箱登录
            </Button>
          </div>

          <div className="flex items-center gap-3 text-xs text-white/35">
            <div className="h-px flex-1 bg-white/10" />
            <span>或使用扫码登录</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              disabled={isLoading}
              onClick={() => handleOAuthLogin('qq')}
              className="h-11 rounded-xl border border-white/10 bg-white/6 text-sm text-white hover:bg-white/10"
            >
              QQ 扫码登录
            </Button>
            <Button
              type="button"
              disabled={isLoading}
              onClick={() => handleOAuthLogin('wechat')}
              className="h-11 rounded-xl border border-white/10 bg-white/6 text-sm text-white hover:bg-white/10"
            >
              微信扫码登录
            </Button>
          </div>

          <label className="flex items-start gap-2 text-xs leading-5 text-white/45">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-1"
            />
            <span>
              我已阅读并同意
              <a className="px-1 text-[#94A9FF]" href="/user-agreement" target="_blank" rel="noreferrer">
                用户协议
              </a>
              和
              <a className="px-1 text-[#94A9FF]" href="/privacy-policy" target="_blank" rel="noreferrer">
                隐私政策
              </a>
            </span>
          </label>
        </div>
      </DialogContent>
    </Dialog>
  )
}
