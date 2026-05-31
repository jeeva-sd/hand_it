import { Loader2Icon } from "lucide-react"
import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"

import { appConfig } from "@/config"
import { useAuthStore } from "@/stores/auth.store"

type AuthRouteMode = "public" | "private"

type AuthRouteGateProps = {
  mode: AuthRouteMode
  children: ReactNode
}

export function AuthRouteGate({ mode, children }: AuthRouteGateProps) {
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
    return <Navigate to="/auth/login" replace />
  }

  if (mode === "public" && status === "authenticated") {
    return <Navigate to={appConfig.auth.redirectAfterLogin} replace />
  }

  return <>{children}</>
}
