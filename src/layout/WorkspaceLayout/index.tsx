import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { WorkspaceSidebar } from './WorkspaceSidebar'
import { WorkspaceHeader } from './WorkspaceHeader'
import { NewbieTour } from "@/layout/components/NewbieTour/NewbieTour.tsx";
import { SendIdeaTour } from "@/layout/components/SebdIdeaTour/index.tsx";
import { NewbieMission } from "@/layout/components/NewbieMission/NewbieMission.tsx";
import { useLoginStore } from "@/stores/loginStore";

/**
 * 主应用布局：左侧固定侧边栏 + 右侧顶部 Header + 路由内容区。
 * 对应 Vue 版本的 MainLayout.vue。
 */
export function WorkspaceLayout() {
  const location = useLocation()
  const [newbieTourOpen, setNewbieTourOpen] = useState(false)
  const setNewbieTourShowed = useLoginStore(state => state.setNewbieTourShowed)
  const hasNewbieTourShowed = useLoginStore(state => state.hasNewbieTourShowed)

  // 发送创作想法引导
  const sendIdeaTourShow = useLoginStore((s) => s.sendIdeaTourShow)
  const setSendIdeaTourShow = useLoginStore((s) => s.setSendIdeaTourShow)

  useEffect(() => {
    if (location.pathname === '/workspace/my-place' && !hasNewbieTourShowed) {
      const timer = setTimeout(() => {
        setNewbieTourOpen(true)
        setNewbieTourShowed()
      }, 200)
      return () => clearTimeout(timer)
    }

  }, [hasNewbieTourShowed, location.pathname, setNewbieTourShowed])

  return (
    <div
      className="relative flex h-screen overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse 55% 45% at 58% 5%, rgba(94, 119, 210, 0.10), transparent 72%)',
        }}
      />
      {/* 侧边栏 */}
      <WorkspaceSidebar/>

      {/* 右侧主体 */}
      <main
        className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden"
        style={{ background: 'transparent' }}
      >
        {/* 顶部 Header - sticky */}
        <div
          className="sticky top-0 z-20 flex h-16 w-full shrink-0 items-center justify-end px-6 md:px-8"
          style={{ background: 'rgba(9, 12, 21, 0.72)', backdropFilter: 'blur(12px)' }}
        >
          <WorkspaceHeader/>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <Outlet/>
          <NewbieMission/>
        </div>
      </main>

      <NewbieTour open={newbieTourOpen} onOpenChange={setNewbieTourOpen}/>
      <SendIdeaTour
        open={sendIdeaTourShow && location.pathname === '/workspace/my-place'}
        onOpenChange={setSendIdeaTourShow}
      />
    </div>
  )
}
