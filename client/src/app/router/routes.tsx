import { Navigate, createBrowserRouter } from "react-router-dom"
import { AppShellLayout } from "@/app/layouts/app-shell"
import { AuthRouteGate } from "@/app/router/auth-route-gate"
import { AuthLayout } from "@/pages/auth/auth-layout"
import { ForgetPasswordPage } from "@/pages/auth/forget-password-page"
import { LoginPage } from "@/pages/auth/login-page"
import { SignupPage } from "@/pages/auth/signup-page"
import { HomePage } from "@/pages/home/home-page"
import { ProjectsPage } from "@/pages/projects/projects-page"
import { MembersPage } from "@/pages/settings/members-page"
import { SettingsPage } from "@/pages/settings/settings-page"
import { useAuthStore } from "@/stores/auth.store"

function RootRedirect() {
  const lastUsedWorkspace = useAuthStore((state) => state.lastUsedWorkspace)
  const defaultWorkspaceId = lastUsedWorkspace?.id || "default"
  return <Navigate to={`/w/${defaultWorkspaceId}`} replace />
}

export const appRouter = createBrowserRouter([
  {
    path: "/auth",
    element: (
      <AuthRouteGate mode="public">
        <AuthLayout />
      </AuthRouteGate>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/auth/login" replace />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "signup",
        element: <SignupPage />,
      },
      {
        path: "forget-password",
        element: <ForgetPasswordPage />,
      },
      {
        path: "*",
        element: <Navigate to="/auth/login" replace />,
      },
    ],
  },
  {
    path: "/w/:workspaceId",
    element: (
      <AuthRouteGate mode="private">
        <AppShellLayout />
      </AuthRouteGate>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "projects",
        element: <ProjectsPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      {
        path: "settings/members",
        element: <MembersPage />,
      },
      {
        path: "*",
        element: <Navigate to="" replace />,
      },
    ],
  },
  {
    path: "/",
    element: (
      <AuthRouteGate mode="private">
        <RootRedirect />
      </AuthRouteGate>
    ),
  },
  {
    path: "*",
    element: (
      <AuthRouteGate mode="private">
        <RootRedirect />
      </AuthRouteGate>
    ),
  },
])
