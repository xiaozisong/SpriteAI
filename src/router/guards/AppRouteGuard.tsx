import { useEffect, useRef } from 'react'
import { useLocation, useMatches, type Location } from 'react-router-dom'
import { MobileRedirectGuard } from '@/router/guards/MobileRedirect'
import { getMatomoTracker } from '@/matomo/trackingMatomoEvent'

/**
 * 路由标题映射表
 */
const ROUTE_TITLES: Record<string, string> = {
  '/': '首页',
  '/editor': 'AI Workspace',
  '/auth/callback': '登录回调',
  '/user-agreement': '用户服务协议',
  '/privacy-policy': '隐私政策',
}

/**
 * 根据路径获取页面标题
 */
const getPageTitle = (pathname: string): string => {
  if (ROUTE_TITLES[pathname]) {
    return ROUTE_TITLES[pathname]
  }

  for (const [route, title] of Object.entries(ROUTE_TITLES)) {
    if (pathname.startsWith(`${route}/`)) {
      return title
    }
  }

  return document.title
}

/**
 * 根据路径获取页面路由配置
 */
const getPageRoute = (pathname: string): string => {
  if (ROUTE_TITLES[pathname]) {
    return pathname
  }

  for (const [route] of Object.entries(ROUTE_TITLES)) {
    if (pathname.startsWith(`${route}/`)) {
      return route
    }
  }
  return '/'
}

/**
 * 全局路由守卫：提供 before / after 路由快照。
 */
export const AppRouteGuard = () => {
  const location = useLocation()
  const matches = useMatches()
  const prevLocationRef = useRef<Location | null>(null)

  useEffect(() => {
    const before = prevLocationRef.current
    const after = location

    const beforeRoute = getPageRoute(before?.pathname || '')
    const afterRoute = getPageRoute(after.pathname || '')
    const matchedTitle = [...matches]
      .reverse()
      .map((match) => (match.handle as { title?: string } | undefined)?.title)
      .find(Boolean)
    const pageTitle = matchedTitle || getPageTitle(after.pathname)

    const tracker = getMatomoTracker()
    if (!tracker) {
      console.warn('[Matomo] tracker is not initialized yet')
      prevLocationRef.current = location
      return
    }

    tracker.push(['setReferrerUrl', beforeRoute])
    tracker.push(['setCustomUrl', afterRoute])
    tracker.push(['setDocumentTitle', pageTitle])
    tracker.push(['trackPageView'])

    prevLocationRef.current = location
  }, [location, matches])

  return <MobileRedirectGuard />
}
