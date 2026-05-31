import { Loader2Icon } from "lucide-react"
import type { ReactNode } from "react"
import { useEffect } from "react"
import { Navigate, useLocation, useParams } from "react-router-dom"

import { appPaths, replaceWorkspaceInPath } from "@/app/router/paths"
import { useResolvedWorkspaceId } from "@/app/router/use-resolved-workspace-id"
import { useWorkspaceStore } from "@/stores/workspace.store"

type WorkspaceRouteGateProps = {
  children: ReactNode
}

export function WorkspaceRouteGate({ children }: WorkspaceRouteGateProps) {
  const location = useLocation()
  const { workspaceId = "" } = useParams()

  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId)
  const setActiveWorkspace = useWorkspaceStore((state) => state.setActiveWorkspace)

  const { isHydrating, resolvedWorkspaceId, workspaces } = useResolvedWorkspaceId()

  const hasRouteWorkspace = workspaceId.length > 0 && workspaces.some((workspace) => workspace.id === workspaceId)

  useEffect(() => {
    if (!hasRouteWorkspace || workspaceId === activeWorkspaceId) {
      return
    }

    setActiveWorkspace(workspaceId)
  }, [activeWorkspaceId, hasRouteWorkspace, setActiveWorkspace, workspaceId])

  if (isHydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Loading workspace...
        </div>
      </div>
    )
  }

  if (workspaces.length === 0 && resolvedWorkspaceId.length === 0) {
    return <Navigate to={appPaths.createWorkspace} replace />
  }

  if (!hasRouteWorkspace) {
    const nextWorkspaceId = resolvedWorkspaceId

    if (!nextWorkspaceId) {
      return <Navigate to={appPaths.createWorkspace} replace />
    }

    const nextPath = replaceWorkspaceInPath(location.pathname, nextWorkspaceId)

    return <Navigate to={`${nextPath}${location.search}${location.hash}`} replace />
  }

  return <>{children}</>
}