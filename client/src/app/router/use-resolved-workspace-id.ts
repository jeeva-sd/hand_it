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

  const { data: fetchedWorkspaces, isPending } = useWorkspacesQuery(authStatus === "authenticated")

  useEffect(() => {
    if (!fetchedWorkspaces) {
      return
    }

    setWorkspaces(fetchedWorkspaces)
  }, [fetchedWorkspaces, setWorkspaces])

  const resolvedWorkspaceId = useMemo(() => {
    if (workspaces.length === 0) {
      return ""
    }

    if (activeWorkspaceId && workspaces.some((workspace) => workspace.id === activeWorkspaceId)) {
      return activeWorkspaceId
    }

    if (lastUsedWorkspace?.id && workspaces.some((workspace) => workspace.id === lastUsedWorkspace.id)) {
      return lastUsedWorkspace.id
    }

    return workspaces[0]?.id ?? ""
  }, [activeWorkspaceId, lastUsedWorkspace?.id, workspaces])

  return {
    isHydrating: isPending && workspaces.length === 0,
    resolvedWorkspaceId,
    workspaces,
  }
}