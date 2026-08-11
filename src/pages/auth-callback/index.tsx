import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useLoginStore } from '@/stores/loginStore'

/**
 * OAuth 登录回调页。
 *
 * QQ/微信授权完成后，后端会重定向到：
 *   /auth/callback?ticket=xxx&redirectTo=/原页面
 *
 * 这个页面只做一件事：用一次性 ticket 换系统 token，然后跳回原页面。
 */
export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const handleOAuthCallback = useLoginStore((s) => s.handleOAuthCallback)
  const [message, setMessage] = useState('正在完成登录...')

  const ticket = searchParams.get('ticket')
  const error = searchParams.get('error')
  const redirectTo = useMemo(() => {
    const raw = searchParams.get('redirectTo') || '/'
    // 只允许站内路径，避免后端或 URL 被构造后跳到外部钓鱼站。
    return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/'
  }, [searchParams])

  useEffect(() => {
    if (error) {
      setMessage(error)
      toast.error(error)
      navigate('/', { replace: true })
      return
    }

    if (!ticket) {
      setMessage('登录凭证缺失，请重新登录')
      toast.error('登录凭证缺失，请重新登录')
      navigate('/', { replace: true })
      return
    }

    // ticket 是短期一次性凭证，成功交换后后端会将其标记为已消费。
    void handleOAuthCallback(ticket).then((result) => {
      if (result.success) {
        toast.success('登录成功')
        navigate(redirectTo, { replace: true })
        return
      }
      setMessage(result.message)
      toast.error(result.message)
      navigate('/', { replace: true })
    })
  }, [error, handleOAuthCallback, navigate, redirectTo, ticket])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080B14] px-6 text-white">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-8 py-6 text-center shadow-2xl">
        <div className="mb-2 text-lg font-semibold">精灵登录</div>
        <div className="text-sm text-white/55">{message}</div>
      </div>
    </div>
  )
}
