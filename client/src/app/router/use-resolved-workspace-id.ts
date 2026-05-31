import { useEffect, useMemo } from "react"

import { useWorkspacesQuery } from "@/features/workspace/use-workspaces-query"
import { useAuthStore } from "@/stores/auth.store"
import { useWorkspaceStore } from "@/stores/workspace.store"

export function useResolvedWorkspaceId() {
  const authStatus = useAuthStore((state) => state.status)
  const lastUsedWorkspace = useAuthStore((state) => state.lastUsedWorkspace)

  const workspaces = useWorkspaceStore((state) => state.workspaces)
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId)
  const setWorkspaces = useWorkspaceStore((state) => state.setWorkspaces)

  const { data: fetchedWorkspaces, isError, isFetched, isPending } = useWorkspacesQuery(
    authStatus === "authenticated"
  )

  useEffect(() => {
    if (!fetchedWorkspaces) {
      return
    }

    setWorkspaces(fetchedWorkspaces)
  }, [fetchedWorkspaces, setWorkspaces])

  const resolvedWorkspaceId = useMemo(() => {
    if (lastUsedWorkspace?.id && (workspaces.length === 0 || workspaces.some((workspace) => workspace.id === lastUsedWorkspace.id))) {
      return lastUsedWorkspace.id
    }

    if (activeWorkspaceId && (workspaces.length === 0 || workspaces.some((workspace) => workspace.id === activeWorkspaceId))) {
      return activeWorkspaceId
    }

    return workspaces[0]?.id ?? ""
  }, [activeWorkspaceId, lastUsedWorkspace?.id, workspaces])

  return {
    isHydrating: isPending && workspaces.length === 0,
    hasFetchedWorkspaceList: isFetched,
    isWorkspaceListError: isError,
    resolvedWorkspaceId,
    workspaces,
  }
}