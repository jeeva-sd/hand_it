import { Navigate, createBrowserRouter } from "react-router-dom"

import { AppShellLayout } from "@/app/layouts/app-shell"
import { AuthRouteGate } from "@/app/router/auth-route-gate"
import { AuthLayout } from "@/pages/auth/auth-layout"
import { ForgetPasswordPage } from "@/pages/auth/forget-password-page"
import { LoginPage } from "@/pages/auth/login-page"
import { SignupPage } from "@/pages/auth/signup-page"
import { ProjectsPage } from "@/pages/projects/projects-page"
import { SettingsPage } from "@/pages/settings/settings-page"

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
    path: "/",
    element: (
      <AuthRouteGate mode="private">
        <AppShellLayout />
      </AuthRouteGate>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/projects" replace />,
      },
      {
        path: "projects",
        element: <ProjectsPage />,
      },
      {
        path: "projects/:projectId",
        element: <ProjectsPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/auth/login" replace />,
  },
])
