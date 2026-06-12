import { useEffect, useMemo } from "react"

import { useWorkspacesQuery } from "@/features/workspace/use-workspaces-query"
import { useAuthStore } from "@/stores/auth.store"
import { useWorkspaceStore } from "@/stores/workspace.store"

export function useResolvedWorkspaceId(excludeId?: string) {
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

    setWorkspaces(fetchedWorkspaces.workspaces)
  }, [fetchedWorkspaces, setWorkspaces])

  const resolvedWorkspaceId = useMemo(() => {
    const availableWorkspaces = excludeId
      ? workspaces.filter((w) => w.id !== excludeId)
      : workspaces

    if (lastUsedWorkspace?.id && lastUsedWorkspace.id !== excludeId) {
      return lastUsedWorkspace.id
    }

    if (activeWorkspaceId && activeWorkspaceId !== excludeId) {
      return activeWorkspaceId
    }

    return availableWorkspaces[0]?.id ?? ""
  }, [activeWorkspaceId, lastUsedWorkspace?.id, workspaces, excludeId])

  const hasFallbackId = Boolean(
    (lastUsedWorkspace?.id && lastUsedWorkspace.id !== excludeId) ||
    (activeWorkspaceId && activeWorkspaceId !== excludeId)
  )

  return {
    isHydrating: !hasFallbackId && isPending && workspaces.length === 0,
    hasFetchedWorkspaceList: isFetched,
    isWorkspaceListError: isError,
    resolvedWorkspaceId,
    workspaces,
  }
}