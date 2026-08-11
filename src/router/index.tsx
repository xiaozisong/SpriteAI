import {
  createBrowserRouter,
  Navigate,
  redirect,
  type LoaderFunctionArgs,
  type RouteObject,
} from "react-router-dom";
import { lazy } from "react";
import {
  hardNavigateToEditorOnce,
  isEditorAssetLoadError,
} from "@/utils/editorNavigationFallback";

import LandingPage from "@/pages/landing";
import { AppRouteGuard } from "@/router/guards/AppRouteGuard";
import UserServiceAgreementPage from "@/pages/agreement/user-service-agreement";
import PrivacyPolicyPage from "@/pages/agreement/privacy-policy";

const EditorPage = lazy(async () => {
  try {
    return await import("@/pages/editor");
  } catch (error) {
    if (isEditorAssetLoadError(error)) {
      hardNavigateToEditorOnce({
        targetPath: `${window.location.pathname}${window.location.search}${window.location.hash}`,
        reason: "编辑器懒加载资源失败",
        error,
      });
    }
    throw error;
  }
});
const AuthCallbackPage = lazy(() => import("@/pages/auth-callback"));

const editorAuthMiddleware = (_args: LoaderFunctionArgs) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw redirect("/");
  }
  return null;
};

const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppRouteGuard />,
    children: [
      {
        index: true,
        element: <LandingPage />,
        handle: { title: "首页" },
      },
      {
        path: "/editor/:workId",
        element: <EditorPage />,
        loader: editorAuthMiddleware,
        handle: { title: "AI Workspace" },
      },
      {
        path: "/auth/callback",
        element: <AuthCallbackPage />,
        handle: { title: "登录回调" },
      },
      {
        path: "/user-agreement",
        element: <UserServiceAgreementPage />,
        handle: { title: "用户服务协议" },
      },
      {
        path: "/privacy-policy",
        element: <PrivacyPolicyPage />,
        handle: { title: "隐私政策" },
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
];

export { routes };
export const router = createBrowserRouter(routes);
