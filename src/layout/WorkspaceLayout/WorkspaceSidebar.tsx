import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useCallback } from 'react'
import LOGO from '@/assets/images/logo.webp'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover'
import { clsx } from 'clsx'
import { AddNewWorkPopover } from '@/components/AddNewWorkPopover'
import { Iconfont } from '@/components/Iconfont'
import { useOptionsStore } from '@/stores/optionsStore'
import { openFeedbackDialog } from '@/components/FeedbackDialog'
import { useLoginStore } from '@/stores/loginStore'

interface MenuChild {
  title: string
  route: string
  routeName: string
}

interface MenuItem {
  title: string
  route: string
  routeName: string
  /** iconfont unicode，如 '\ue607' */
  icon: string
  children?: MenuChild[]
}

const menuData: MenuItem[] = [
  {
    title: '我的空间',
    route: '/workspace/my-place',
    routeName: 'my-place',
    icon: '\ue607',
  },
  {
    title: '创作榜单',
    route: '/workspace/trending-list',
    routeName: 'trending-list',
    icon: '\ue608',
  },
  {
    title: 'AI专家',
    route: '/workspace/ai-expert',
    routeName: 'ai-expert',
    icon: '\ue606',
    children: [
      {
        title: '拆书仿写',
        route: '/workspace/ai-expert/book-analysis',
        routeName: 'book-analysis',
      },
      {
        title: '文风提炼',
        route: '/workspace/ai-expert/writing-styles',
        routeName: 'writing-styles',
      },
    ],
  },
  {
    title: '灵感工坊',
    route: '/workspace/creation-community',
    routeName: 'creation-community',
    icon: '\ue609',
    children: [
      { title: '课程', route: '/workspace/creation-community/course', routeName: 'course' },
      { title: '分享', route: '/workspace/creation-community/share', routeName: 'share' },
      { title: '提示词', route: '/workspace/creation-community/prompt', routeName: 'prompt' },
    ],
  },
]

function getActiveRoute(pathname: string): string {
  for (const item of menuData) {
    if (item.children?.length) {
      for (const child of item.children) {
        if (pathname.startsWith(child.route)) return child.route
      }
    } else {
      if (item.route === '/workspace/my-place' && pathname === '/workspace/my-place')
        return item.route
      if (item.route !== '/' && pathname.startsWith(item.route)) return item.route
    }
  }
  return pathname
}

/** 关于我们 Popover 内容 */
function AboutUsContent({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const userAgreementUrl = '/user-agreement'
  const privacyPolicyUrl = '/privacy-policy'

  return (
    <div className="relative">
      {/* 关闭按钮 */}
      <button
        className="iconfont absolute text-(--text-primary) right-4 top-4 flex h-6 w-6 cursor-pointer items-center justify-center rounded p-1 text-[12px] transition-colors hover:bg-(--bg-hover)"
        onClick={onClose}
        dangerouslySetInnerHTML={{ __html: '&#xe633;' }}
      />

      {/* 标题 */}
      <div className="flex items-center px-5 py-4">
        <h3 className="m-0 text-base font-semibold text-(--text-primary)">关于我们</h3>
      </div>

      {/* 正文 */}
      <div className="px-5 pb-5">
        <p className="mb-3 text-[13px] leading-relaxed text-(--text-secondary)">
          精灵是一款面向文字创作者的 AI 原生创作工作空间。
        </p>
        <p className="mb-3 text-[13px] leading-relaxed text-(--text-secondary)">
          精灵通过写作智能体串联灵感、创作与优化，让每一次创作都沉淀为可继续编辑的成果。
        </p>
        <p className="mb-5 text-[13px] leading-relaxed text-(--text-secondary)">
          精灵致力于成为安静、专业、始终理解创作上下文的写作伙伴。
        </p>

        {/* 隐私安全 */}
        <div className="mt-5 border-t pt-4 border-(--border-color)">
          <h4 className="mb-3 text-sm font-semibold text-(--text-primary)">隐私安全</h4>
          <div className="mb-2 flex gap-4">
            <button
              type="button"
              onClick={() => navigate(privacyPolicyUrl)}
              className="cursor-pointer border-0 bg-transparent p-0 text-[13px] no-underline transition-colors hover:underline! text-(--text-secondary)"
            >
              隐私协议
            </button>
            <button
              type="button"
              onClick={() => navigate(userAgreementUrl)}
              className="cursor-pointer border-0 bg-transparent p-0 text-[13px] no-underline transition-colors hover:underline! text-(--text-secondary)"
            >
              用户协议
            </button>
          </div>
          <div className="mb-2">
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noreferrer"
              className="text-[13px] no-underline transition-colors hover:underline! text-(--text-secondary)"
            >
              浙ICP备17039406号-19
            </a>
          </div>
          <div>
            <a
              href="https://beian.mps.gov.cn/#/query/webSearch?code=33060402002057"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-[13px] no-underline transition-colors hover:underline! text-(--text-secondary)"
            >
              浙公网安备33060402002057号
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 加入社群 Popover 内容 */
const JoinGroupContent = ({
                            onClose,
                            qrCode,
                            desc,
                          }: {
  onClose: () => void
  qrCode?: string
  desc?: string
}) => {
  return (
    <div className="relative flex flex-col items-center px-6 pb-7 pt-9">
      {/* 关闭按钮 */}
      <button
        className="iconfont absolute right-4 top-4 text-(--text-primary) flex h-6 w-6 cursor-pointer items-center justify-center rounded p-1 text-[12px] transition-colors hover:bg-(--bg-hover)"
        onClick={onClose}
        dangerouslySetInnerHTML={{ __html: '&#xe633;' }}
      />

      {desc && <p className="mb-3 text-sm font-semibold text-(--text-primary)">{desc}</p>}

      {/* 二维码 */}
      {qrCode ? (
        <div className="flex items-center justify-center rounded bg-white p-3">
          <img
            src={qrCode}
            alt="产品内测群二维码"
            className="h-27 w-27 rounded object-contain"
          />
        </div>
      ) : (
            <div className="flex h-27 w-27 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
          二维码加载中
        </div>
      )}
    </div>
  )
}

/**
 * Workspace 侧边栏。
 * 对应 Vue 版本的 MainSidebar.vue。
 * 底部工具栏使用 shadcn/ui Tooltip + Popover 实现。
 */
export function WorkspaceSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeRoute = getActiveRoute(location.pathname)

  const [aboutOpen, setAboutOpen] = useState(false)
  const requireLogin = useLoginStore((s) => s.requireLogin)

  const handleMenuClick = (item: MenuItem | MenuChild) => {
    navigate(item.route)
  }

  const goLanding = useCallback(() => {
    navigate('/')
  }, [navigate])

  const handleFeedbackClick = useCallback(() => {
    void requireLogin(openFeedbackDialog).catch(() => {
      // 用户取消登录时，不打开反馈弹窗
    })
  }, [requireLogin])

  return (
    <aside
      className="relative z-30 flex h-full w-15 shrink-0 flex-col justify-between border-r px-2 py-3"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* 顶部区域 */}
      <div className="flex flex-col items-center">
        {/* Logo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="返回精灵首页"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[10px] transition-colors hover:bg-(--bg-hover)"
              onClick={goLanding}
            >
              <img src={LOGO} alt="精灵" className="h-7 w-7 object-contain" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">精灵</TooltipContent>
        </Tooltip>

        {/* 创建新作品：保留原 Popover 和业务逻辑，仅压缩为 Icon Button。 */}
        <AddNewWorkPopover
          isSidebar
          popperClass="add-new-work-popover-sidebar"
          offset={-4}
          side="right"
          align="start"
        >
          <button
            type="button"
            aria-label="创建新作品"
            className="mt-5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] text-lg transition-all hover:-translate-y-px"
            style={{
              background: 'rgba(143, 168, 255, 0.14)',
              color: 'var(--text-accent)',
              border: '1px solid rgba(143, 168, 255, 0.22)',
            }}
          >
            +
          </button>
        </AddNewWorkPopover>

        {/* Icon Navigation：保留全部路由；含子菜单的入口通过 Popover 提供。 */}
        <nav className="mt-6 flex w-full flex-col items-center gap-2">
          {menuData.map((item) => {
            const isParentActive = item.children?.some((child) => child.route === activeRoute) ?? false
            const isActive = isParentActive || activeRoute === item.route
            const iconButtonClass = clsx(
              'flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] text-[18px] transition-all duration-200',
              isActive ? 'text-(--text-primary)' : 'text-(--text-muted) hover:text-(--text-secondary)',
            )
            const iconButtonStyle = isActive
              ? { background: 'rgba(143, 168, 255, 0.13)' }
              : undefined

            if (item.children?.length) {
              return (
                <Popover key={item.route}>
                  <Tooltip>
                    <PopoverTrigger asChild>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={item.title}
                          className={iconButtonClass}
                          style={iconButtonStyle}
                        >
                          <span className="iconfont">{item.icon}</span>
                        </button>
                      </TooltipTrigger>
                    </PopoverTrigger>
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  </Tooltip>
                  <PopoverContent
                    side="right"
                    align="start"
                    sideOffset={10}
                    className="w-47.5 border p-2"
                    style={{
                      background: 'var(--bg-dialog)',
                      borderColor: 'var(--border-color)',
                      boxShadow: '0 16px 38px rgba(0, 0, 0, 0.28)',
                    }}
                  >
                    <p className="px-2 pb-2 pt-1 text-xs text-(--text-muted)">{item.title}</p>
                    {item.children.map((child) => (
                      <button
                        key={child.route}
                        type="button"
                        onClick={() => handleMenuClick(child)}
                        className={clsx(
                          'flex w-full cursor-pointer items-center rounded-xl px-2.5 py-2 text-left text-sm transition-colors',
                          child.route === activeRoute
                            ? 'bg-(--bg-active) text-(--text-primary)'
                            : 'text-(--text-secondary) hover:bg-(--bg-hover)',
                        )}
                      >
                        {child.title}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              )
            }

            return (
              <Tooltip key={item.route}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={item.title}
                    onClick={() => handleMenuClick(item)}
                    className={iconButtonClass}
                    style={iconButtonStyle}
                  >
                    <span className="iconfont">{item.icon}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{item.title}</TooltipContent>
              </Tooltip>
            )
          })}
        </nav>
      </div>

      {/* 底部工具栏：仅保留全局工具，社群二维码仍可通过原有相关入口查看。 */}
      <div className="flex flex-col items-center gap-2">
        <Popover open={aboutOpen} onOpenChange={setAboutOpen}>
          <Tooltip>
            <PopoverAnchor asChild>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="关于精灵"
                  className="iconfont flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] text-lg text-(--text-muted) transition-colors hover:bg-(--bg-hover) hover:text-(--text-secondary)"
                  onClick={() => setAboutOpen((value) => !value)}
                  dangerouslySetInnerHTML={{ __html: '&#xe604;' }}
                />
              </TooltipTrigger>
            </PopoverAnchor>
            <TooltipContent side="right">关于精灵</TooltipContent>
          </Tooltip>
          <PopoverContent
            side="right"
            align="end"
            sideOffset={10}
            className="w-75 border p-0"
            style={{
              background: 'var(--bg-dialog)',
              borderColor: 'var(--border-color)',
              boxShadow: '0 16px 38px rgba(0, 0, 0, 0.28)',
            }}
          >
            <AboutUsContent onClose={() => setAboutOpen(false)} />
          </PopoverContent>
        </Popover>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="问题反馈"
              className="iconfont flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] text-lg text-(--text-muted) transition-colors hover:bg-(--bg-hover) hover:text-(--text-secondary)"
              onClick={handleFeedbackClick}
            >
              &#xe64e;
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">问题反馈</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  )
}
