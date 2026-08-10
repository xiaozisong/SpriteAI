import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { createWorkReq } from '@/api/works'
import { useLoginStore } from '@/stores/loginStore'
import { openLoginDialog } from '@/components/LoginDialog'
import { VideoLanding } from './VideoLanding'
import './landing.css'
import { trackEvent } from "@/matomo/trackingMatomoEvent.ts";

export default function LandingPage() {
  const navigate = useNavigate()
  const [isCreatingWork, setIsCreatingWork] = useState(false)

  const isLoggedIn = useLoginStore(state => state.isLoggedIn)
  const requireLogin = useLoginStore(state => state.requireLogin)

  const handleShowLogin = useCallback(async () => {
    try {
      await openLoginDialog()
    } catch {
      // 用户关闭登录弹窗时静默忽略
    }
  }, [])

  const addQuickWork = useCallback(async () => {
    if (isCreatingWork) return
    try {
      setIsCreatingWork(true)
      const req = await createWorkReq('doc')
      if (req?.id) {
        navigate(`/quick-editor/${req.id}`, { state: { showTake2: true } })
      }
    } catch {
      toast.error('创建作品失败，请稍后重试')
    } finally {
      setIsCreatingWork(false)
    }
  }, [isCreatingWork, navigate])
  
  const addScriptWork = useCallback(async () => {
    if (isCreatingWork) return
    try {
      setIsCreatingWork(true)
      const req = await createWorkReq("script")
      if (req?.id) {
        navigate(`/script-editor/${req.id}`, { state: { isNew: true } })
      }
    } catch {
      toast.error("创建作品失败，请稍后重试")
    } finally {
      setIsCreatingWork(false)
    }
  },[isCreatingWork, navigate])

  const addWorkEditor = useCallback(async () => {
    if (isCreatingWork) return
    try {
      setIsCreatingWork(true)
      const req = await createWorkReq('editor')
      if (req?.id) {
        navigate(`/editor/${req.id}`, { state: { showTake2: true } })
      }
    } catch {
      toast.error('创建作品失败，请稍后重试')
    } finally {
      setIsCreatingWork(false)
    }
  }, [isCreatingWork, navigate])

  const handleQuickEditorClick = async () => {
    trackEvent('Story Creation', 'Click', 'Quick New from Landing')
    await requireLogin(addQuickWork)
  }

  const handleScriptEditorClick = async () => {
    trackEvent('Story Creation', 'Click', 'Script New from Landing')
    await requireLogin(addScriptWork)
  }

  const handleEditorClick = async () => {
    trackEvent('Story Creation', 'Click', "Common New from Landing")
    await requireLogin(addWorkEditor)
  }

  return (
    <VideoLanding
      isLoggedIn={isLoggedIn}
      isCreatingWork={isCreatingWork}
      onLogin={handleShowLogin}
      onCreateDocument={handleQuickEditorClick}
      onCreateScript={handleScriptEditorClick}
      onCreateWorkspace={handleEditorClick}
    />
  )
}
