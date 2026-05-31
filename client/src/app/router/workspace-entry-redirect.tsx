import { Navigate } from "react-router-dom"

import { appPaths } from "@/app/router/paths"
import { RouteLoadingScreen } from "@/app/router/route-loading-screen"
import { useResolvedWorkspaceId } from "@/app/router/use-resolved-workspace-id"

export function WorkspaceEntryRedirect() {
  const { isHydrating, resolvedWorkspaceId } = useResolvedWorkspaceId()

  if (isHydrating) {
    return <RouteLoadingScreen message="Preparing your workspace..." />
  }

  if (!resolvedWorkspaceId) {
    return <Navigate to={appPaths.createWorkspace} replace />
  }

  return <Navigate to={appPaths.workspaceProjects(resolvedWorkspaceId)} replace />
}