import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/stores/auth.store"
import { RouteLoadingScreen } from "@/app/router/route-loading-screen"

type AuthRouteMode = "public" | "private"

type AuthRouteGateProps = {
  mode: AuthRouteMode
  children: ReactNode
}

export function AuthRouteGate({ mode, children }: AuthRouteGateProps) {
  const location = useLocation()
  const status = useAuthStore((state) => state.status)
  const hasCheckedSession = useAuthStore((state) => state.hasCheckedSession)
  const lastUsedWorkspace = useAuthStore((state) => state.lastUsedWorkspace)

  if (!hasCheckedSession) {
    return <RouteLoadingScreen message="Checking session..." />
  }

  if (mode === "private" && status !== "authenticated") {
    const searchParams = new URLSearchParams({ continue: `${location.pathname}${location.search}${location.hash}` })
    return <Navigate to={`/auth/login?${searchParams.toString()}`} replace />
  }

  if (mode === "public" && status === "authenticated") {
    const continuePath = new URLSearchParams(location.search).get("continue")
    if (continuePath && continuePath.startsWith("/")) {
      return <Navigate to={continuePath} replace />
    }
    const defaultWorkspaceId = lastUsedWorkspace?.id || "default"
    return <Navigate to={`/w/${defaultWorkspaceId}/projects`} replace />
  }

  return <>{children}</>
}
