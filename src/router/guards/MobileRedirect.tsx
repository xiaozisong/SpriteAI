import { Outlet } from 'react-router-dom'

/**
 * 移动端专属路由已移除，统一使用首页 / editor。
 * 保留 Outlet 以兼容 AppRouteGuard 结构。
 */
export const MobileRedirectGuard = () => {
  return <Outlet />
}
