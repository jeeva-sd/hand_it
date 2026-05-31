import { useEffect, useMemo } from "react"
import { Navigate, useSearchParams } from "react-router-dom"

import { appPaths, isProjectSection, type ProjectSection } from "@/app/router/paths"
import { RouteLoadingScreen } from "@/app/router/route-loading-screen"
import { useResolvedWorkspaceId } from "@/app/router/use-resolved-workspace-id"
import { useWorkspaceQuery } from "@/features/workspace/use-workspace-query"
import { selectWorkspace } from "@/services/workspace.service"
import { useAuthStore } from "@/stores/auth.store"
import { useWorkspaceStore } from "@/stores/workspace.store"

function readSearchParam(searchParams: URLSearchParams, key: string): string {
  return searchParams.get(key)?.trim() ?? ""
}

function resolveProjectSection(searchParams: URLSearchParams): ProjectSection {
  const candidates = [searchParams.get("section"), searchParams.get("tab"), searchParams.get("page")]

  for (const candidate of candidates) {
    if (isProjectSection(candidate)) {
      return candidate
    }
  }

  return "files"
}

export function WorkspaceEntryRedirect() {
  const [searchParams] = useSearchParams()

  const { isHydrating, resolvedWorkspaceId } = useResolvedWorkspaceId()
  const workspaceIdFromSearch = useMemo(() => readSearchParam(searchParams, "workspaceId"), [searchParams])
  const projectIdFromSearch = useMemo(() => readSearchParam(searchParams, "projectId"), [searchParams])
  const projectSectionFromSearch = useMemo(() => resolveProjectSection(searchParams), [searchParams])

  const workspaceQuery = useWorkspaceQuery(workspaceIdFromSearch)

  const lastUsedWorkspace = useAuthStore((state) => state.lastUsedWorkspace)
  const setLastUsedWorkspace = useAuthStore((state) => state.setLastUsedWorkspace)
  const upsertWorkspace = useWorkspaceStore((state) => state.upsertWorkspace)

  const isUrlWorkspaceHydrating = workspaceIdFromSearch.length > 0 && workspaceQuery.isLoading
  const urlWorkspace = workspaceIdFromSearch.length > 0 && workspaceQuery.isSuccess ? workspaceQuery.data : null
  const nextWorkspaceId = urlWorkspace?.id ?? resolvedWorkspaceId

  useEffect(() => {
    if (!urlWorkspace) {
      return
    }

    upsertWorkspace(urlWorkspace)

    if (lastUsedWorkspace?.id === urlWorkspace.id) {
      return
    }

    setLastUsedWorkspace({
      id: urlWorkspace.id,
      name: urlWorkspace.name,
      plan: urlWorkspace.plan,
      roleId: lastUsedWorkspace?.roleId ?? null,
      accessId: lastUsedWorkspace?.accessId ?? null,
    })

    void selectWorkspace(urlWorkspace.id).catch(() => undefined)
  }, [
    lastUsedWorkspace?.accessId,
    lastUsedWorkspace?.id,
    lastUsedWorkspace?.roleId,
    setLastUsedWorkspace,
    upsertWorkspace,
    urlWorkspace,
  ])

  if (isHydrating || isUrlWorkspaceHydrating) {
    return <RouteLoadingScreen message="Preparing your workspace..." />
  }

  if (!nextWorkspaceId) {
    return <Navigate to={appPaths.createWorkspace} replace />
  }

  if (projectIdFromSearch.length > 0) {
    return (
      <Navigate
        to={appPaths.workspaceProjectSection(nextWorkspaceId, projectIdFromSearch, projectSectionFromSearch)}
        replace
      />
    )
  }

  return <Navigate to={appPaths.workspaceProjects(nextWorkspaceId)} replace />
}
