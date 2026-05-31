import { Loader2Icon } from "lucide-react"
import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"

import { buildLoginPath, buildPostLoginPath, getLocationTarget } from "@/app/router/post-login"
import { useAuthStore } from "@/stores/auth.store"

type AuthRouteMode = "public" | "private"

type AuthRouteGateProps = {
  mode: AuthRouteMode
  children: ReactNode
}

export function AuthRouteGate({ mode, children }: AuthRouteGateProps) {
  const location = useLocation()
  const status = useAuthStore((state) => state.status)
  const hasCheckedSession = useAuthStore((state) => state.hasCheckedSession)

  if (!hasCheckedSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Checking session...
        </div>
      </div>
    )
  }

  if (mode === "private" && status !== "authenticated") {
    const target = getLocationTarget(location.pathname, location.search, location.hash)

    return <Navigate to={buildLoginPath(target)} replace />
  }

  if (mode === "public" && status === "authenticated") {
    const continuePath = new URLSearchParams(location.search).get("continue")

    return <Navigate to={buildPostLoginPath(continuePath)} replace />
  }

  return <>{children}</>
}
