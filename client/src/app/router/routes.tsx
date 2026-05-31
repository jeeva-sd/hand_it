import { Navigate, createBrowserRouter } from "react-router-dom"

import { AppShellLayout } from "@/app/layouts/app-shell"
import { AuthRouteGate } from "@/app/router/auth-route-gate"
import { LegacyWorkspaceRedirect } from "@/app/router/legacy-workspace-redirect"
import { WorkspaceRouteGate } from "@/app/router/workspace-route-gate"
import { AuthLayout } from "@/pages/auth/auth-layout"
import { ForgetPasswordPage } from "@/pages/auth/forget-password-page"
import { LoginPage } from "@/pages/auth/login-page"
import { PostLoginResolverPage } from "@/pages/auth/post-login-resolver-page"
import { SignupPage } from "@/pages/auth/signup-page"
import { ProjectsPage } from "@/pages/projects/projects-page"
import { BillingPage } from "@/pages/settings/billing-page"
import { MembersPage } from "@/pages/settings/members-page"
import { SettingsPage } from "@/pages/settings/settings-page"
import { CreateWorkspacePage } from "@/pages/workspace/create-workspace-page"

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
    path: "/post-login",
    element: (
      <AuthRouteGate mode="private">
        <PostLoginResolverPage />
      </AuthRouteGate>
    ),
  },
  {
    path: "/workspace/create",
    element: (
      <AuthRouteGate mode="private">
        <CreateWorkspacePage />
      </AuthRouteGate>
    ),
  },
  {
    path: "/w/:workspaceId",
    element: (
      <AuthRouteGate mode="private">
        <WorkspaceRouteGate>
          <AppShellLayout />
        </WorkspaceRouteGate>
      </AuthRouteGate>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="projects" replace />,
      },
      {
        path: "projects",
        element: <ProjectsPage />,
      },
      {
        path: "projects/:projectId",
        element: <Navigate to="files" replace />,
      },
      {
        path: "projects/:projectId/files",
        element: <ProjectsPage projectTab="files" />,
      },
      {
        path: "projects/:projectId/shares",
        element: <ProjectsPage projectTab="shares" />,
      },
      {
        path: "projects/:projectId/activity",
        element: <ProjectsPage projectTab="activity" />,
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
        path: "settings/billing",
        element: <BillingPage />,
      },
      {
        path: "*",
        element: <Navigate to="projects" replace />,
      },
    ],
  },
  {
    path: "/",
    element: (
      <AuthRouteGate mode="private">
        <LegacyWorkspaceRedirect target="projects" />
      </AuthRouteGate>
    ),
  },
  {
    path: "/w",
    element: (
      <AuthRouteGate mode="private">
        <LegacyWorkspaceRedirect target="projects" />
      </AuthRouteGate>
    ),
  },
  {
    path: "/projects",
    element: (
      <AuthRouteGate mode="private">
        <LegacyWorkspaceRedirect target="projects" />
      </AuthRouteGate>
    ),
  },
  {
    path: "/projects/:projectId",
    element: (
      <AuthRouteGate mode="private">
        <LegacyWorkspaceRedirect target="project" />
      </AuthRouteGate>
    ),
  },
  {
    path: "/settings",
    element: (
      <AuthRouteGate mode="private">
        <LegacyWorkspaceRedirect target="settings" />
      </AuthRouteGate>
    ),
  },
  {
    path: "/settings/members",
    element: (
      <AuthRouteGate mode="private">
        <LegacyWorkspaceRedirect target="members" />
      </AuthRouteGate>
    ),
  },
  {
    path: "/settings/billing",
    element: (
      <AuthRouteGate mode="private">
        <LegacyWorkspaceRedirect target="billing" />
      </AuthRouteGate>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/auth/login" replace />,
  },
])
