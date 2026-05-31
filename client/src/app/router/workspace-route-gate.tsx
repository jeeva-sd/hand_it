import type { ReactNode } from "react"
import { useEffect } from "react"
import { Navigate, useLocation, useParams } from "react-router-dom"

import { appPaths, replaceWorkspaceInPath } from "@/app/router/paths"
import { RouteLoadingScreen } from "@/app/router/route-loading-screen"
import { useResolvedWorkspaceId } from "@/app/router/use-resolved-workspace-id"
import { useWorkspaceQuery } from "@/features/workspace/use-workspace-query"
import { ApiError } from "@/services/http.service"
import { selectWorkspace } from "@/services/workspace.service"
import { useAuthStore } from "@/stores/auth.store"
import { useWorkspaceStore } from "@/stores/workspace.store"

type WorkspaceRouteGateProps = {
  children: ReactNode
}

export function WorkspaceRouteGate({ children }: WorkspaceRouteGateProps) {
  const location = useLocation()
  const { workspaceId = "" } = useParams()

  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId)
  const setActiveWorkspace = useWorkspaceStore((state) => state.setActiveWorkspace)
  const upsertWorkspace = useWorkspaceStore((state) => state.upsertWorkspace)
  const lastUsedWorkspace = useAuthStore((state) => state.lastUsedWorkspace)
  const setLastUsedWorkspace = useAuthStore((state) => state.setLastUsedWorkspace)

  const { hasFetchedWorkspaceList, isHydrating, isWorkspaceListError, resolvedWorkspaceId, workspaces } =
    useResolvedWorkspaceId()
  const workspaceQuery = useWorkspaceQuery(workspaceId)

  const routeWorkspaceFromStore = workspaces.find((workspace) => workspace.id === workspaceId)
  const routeWorkspace = routeWorkspaceFromStore ?? workspaceQuery.data
  const hasRouteWorkspace = workspaceId.length > 0 && Boolean(routeWorkspace)
  const isRouteWorkspaceHydrating = workspaceId.length > 0 && workspaceQuery.isLoading && !routeWorkspaceFromStore
  const isRouteWorkspaceNotFound =
    workspaceId.length > 0 &&
    workspaceQuery.isError &&
    workspaceQuery.error instanceof ApiError &&
    (workspaceQuery.error.status === 403 || workspaceQuery.error.status === 404)

  const shouldUpsertRouteWorkspace =
    Boolean(routeWorkspace) &&
    (!routeWorkspaceFromStore ||
      routeWorkspaceFromStore.name !== routeWorkspace?.name ||
      routeWorkspaceFromStore.plan !== routeWorkspace?.plan ||
      routeWorkspaceFromStore.memberCount !== routeWorkspace?.memberCount)

  useEffect(() => {
    if (!routeWorkspace || !shouldUpsertRouteWorkspace) {
      return
    }

    upsertWorkspace(routeWorkspace)
  }, [routeWorkspace, shouldUpsertRouteWorkspace, upsertWorkspace])

  useEffect(() => {
    if (!hasRouteWorkspace || !routeWorkspace) {
      return
    }

    if (workspaceId !== activeWorkspaceId) {
      setActiveWorkspace(workspaceId)
    }

    if (lastUsedWorkspace?.id === workspaceId) {
      return
    }

    setLastUsedWorkspace({
      id: routeWorkspace.id,
      name: routeWorkspace.name,
      plan: routeWorkspace.plan,
      roleId: lastUsedWorkspace?.roleId ?? null,
      accessId: lastUsedWorkspace?.accessId ?? null,
    })

    void selectWorkspace(workspaceId).catch(() => undefined)
  }, [
    activeWorkspaceId,
    hasRouteWorkspace,
    lastUsedWorkspace?.accessId,
    lastUsedWorkspace?.id,
    lastUsedWorkspace?.roleId,
    routeWorkspace,
    setActiveWorkspace,
    setLastUsedWorkspace,
    workspaceId,
  ])

  if (isHydrating || isRouteWorkspaceHydrating) {
    return <RouteLoadingScreen message="Loading workspace..." />
  }

  if (!hasRouteWorkspace) {
    if (workspaceId.length > 0 && !hasFetchedWorkspaceList && !workspaceQuery.isError) {
      return <RouteLoadingScreen message="Loading workspace..." />
    }

    if (workspaceId.length > 0 && workspaceQuery.isError && !isRouteWorkspaceNotFound) {
      return <>{children}</>
    }

    if (workspaceId.length > 0 && isWorkspaceListError && !workspaceQuery.isError) {
      return <>{children}</>
    }

    const nextWorkspaceId = resolvedWorkspaceId

    if (!nextWorkspaceId) {
      return <Navigate to={appPaths.createWorkspace} replace />
    }

    const nextPath = replaceWorkspaceInPath(location.pathname, nextWorkspaceId)

    return <Navigate to={`${nextPath}${location.search}${location.hash}`} replace />
  }

  return <>{children}</>
}