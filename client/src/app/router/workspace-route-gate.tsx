import type { ReactNode } from "react"
import { useEffect } from "react"
import { Navigate, useLocation, useParams } from "react-router-dom"

import { appPaths, replaceWorkspaceInPath } from "@/app/router/paths"
import { RouteLoadingScreen } from "@/app/router/route-loading-screen"
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
    return <RouteLoadingScreen message="Loading workspace..." />
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