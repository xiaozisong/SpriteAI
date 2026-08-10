import { useNavigate, useLocation } from 'react-router-dom'
import { Iconfont } from '@/components/Iconfont'
import { Button } from '@/components/ui/Button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { useState, useCallback } from 'react'
import { showNotesSelectorDialog } from '@/utils/showNotesSelectorDialog'
import { useChatInputStore } from '@/stores/chatInputStore'
import { useLoginStore, selectIsLoggedIn, selectAvatarDataUrl } from '@/stores/loginStore'
import { InsiteMessage } from '@/components/InsiteMessage'
import { openLoginDialog } from '@/components/LoginDialog'
import { openAccountDialog } from '@/components/AccountDialog'
import { openQuotaDialog } from '@/components/QuotaDialog'
import { UserCenterDialog } from '@/components/UserCenterDialog'
import { toast } from 'sonner'

/**
 * 主顶部 Header 骨架。
 * 对应 Vue 版本的 MainHeader.vue（src/components/MainHeader.vue）。
 *
 * TODO:
 *  - 接入主题切换 themeStore
 */
export function WorkspaceHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedNotes, removeNote, addNote, clearSelectedNotes } = useChatInputStore()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  // const [showUserCenterDialog, setShowUserCenterDialog] = useState(false)

  const isLoggedIn = useLoginStore(selectIsLoggedIn)
  const logout = useLoginStore((s) => s.logout)
  const requireLogin = useLoginStore((s) => s.requireLogin)
  const avatarData = useLoginStore(selectAvatarDataUrl)

  const handleAccountMenuClick = useCallback(() => {
    setUserMenuOpen(false)
    openAccountDialog()
  }, [])

  const handleQuotaMenuClick = useCallback(() => {
    setUserMenuOpen(false)
    openQuotaDialog()
  }, [])

  const openNotesSelector = useCallback(async () => {
    try {
      const result = await showNotesSelectorDialog()
      if (result.success && result.notes.length > 0) {
        selectedNotes.forEach((note) => removeNote(note.id))
        if (!location.pathname.startsWith('/workspace')) {
          navigate('/workspace/my-place')
          await new Promise((r) => setTimeout(r, 200))
        }
        result.notes.forEach((note) => addNote(note))
      } else if (result.success && result.notes.length === 0) {
        if (!location.pathname.startsWith('/workspace')) {
          navigate('/workspace/my-place')
          await new Promise((r) => setTimeout(r, 200))
        }
        clearSelectedNotes()
      }
    } catch {
      // 用户取消或关闭对话框，不做任何操作
    }
  }, [location.pathname, navigate, selectedNotes, removeNote, addNote, clearSelectedNotes])

  const handleNotesClick = useCallback(() => {
    void requireLogin(openNotesSelector).catch(() => {
      // 用户取消登录，不做任何操作
    })
  }, [openNotesSelector, requireLogin])

  const handleUserClick = useCallback(async () => {
    if (!isLoggedIn) {
      try {
        await openLoginDialog()
        // 登录成功后可在此刷新状态或做后续处理
      } catch {
        // 用户关闭对话框，忽略
      }
    } else {
      setUserMenuOpen((v) => !v)
    }
  }, [isLoggedIn])

  const handleLogoutMenuClick = useCallback(async () => {
    setUserMenuOpen(false)
    await logout()
    toast.success('退出登录成功')
  }, [logout])

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="hidden cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs text-(--text-muted) transition-colors hover:bg-(--bg-hover) hover:text-(--text-secondary) sm:flex"
        onClick={handleQuotaMenuClick}
      >
        <span className="iconfont text-[13px]">&#xe60a;</span>
        创作额度
      </button>

      {/* 笔记管理 */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="iconfont flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-xl text-base text-(--text-muted) hover:bg-(--bg-hover) hover:text-(--text-secondary)"
            onClick={handleNotesClick}
          >
            <Iconfont unicode="&#xe644;" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          笔记管理
        </TooltipContent>
      </Tooltip>

      {/* 分割线 */}
      <div className="mx-1 h-4 w-px bg-(--border-color)" />

      {/* 站内消息 */}
      <InsiteMessage />

      {/* 用户头像 / 登录按钮（对应 Vue MainHeader 已登录 el-popover + 账号/额度/退出） */}
      <div className="ml-3">
        {!isLoggedIn ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                role="button"
                title="登录"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-lg text-(--text-secondary) transition-colors hover:bg-(--bg-hover)"
                onClick={handleUserClick}
              >
                <Iconfont unicode="&#xe60b;" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              登录
            </TooltipContent>
          </Tooltip>

        ) : (
          <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
            <PopoverTrigger asChild>
              <div className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-(--border-color)">
                <img src={avatarData} alt="用户头像" className="h-full w-full object-cover" />
              </div>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              side="bottom"
              className="w-45 border p-2"
              style={{
                background: 'var(--bg-dialog)',
                borderColor: 'var(--border-color)',
                boxShadow: '0 16px 38px rgba(0, 0, 0, 0.28)',
              }}
            >
              <div className="flex flex-col">
                <div
                  role="button"
                  className="cursor-pointer rounded-xl px-3 py-2 text-sm text-(--text-secondary) outline-none transition-colors hover:bg-(--bg-hover) hover:text-(--text-primary)"
                  onClick={handleAccountMenuClick}
                  onKeyDown={(e) => e.key === 'Enter' && handleAccountMenuClick()}
                >
                  账号
                </div>
                <div
                  role="button"
                  className="cursor-pointer rounded-xl px-3 py-2 text-sm text-(--text-secondary) outline-none transition-colors hover:bg-(--bg-hover) hover:text-(--text-primary)"
                  onClick={handleQuotaMenuClick}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuotaMenuClick()}
                >
                  额度
                </div>
                <div
                  role="button"
                  className="cursor-pointer rounded-xl px-3 py-2 text-sm text-[#e69191] outline-none transition-colors hover:bg-[rgba(230,145,145,0.1)]"
                  onClick={handleLogoutMenuClick}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogoutMenuClick()}
                >
                  退出登录
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/*<UserCenterDialog*/}
      {/*  open={showUserCenterDialog}*/}
      {/*  onOpenChange={setShowUserCenterDialog}*/}
      {/*  onEditProfile={openAccountDialog}*/}
      {/*  onLogout={handleLogoutMenuClick}*/}
      {/*/>*/}
    </div>
  )
}
