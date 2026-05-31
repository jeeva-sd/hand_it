import { useEffect, useMemo } from "react"
import { Loader2Icon } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { appPaths } from "@/app/router/paths"
import {
  clearStoredContinuePath,
  normalizeContinuePath,
  readStoredContinuePath,
} from "@/app/router/post-login"
import { useWorkspacesQuery } from "@/features/workspace/use-workspaces-query"
import { useAuthStore } from "@/stores/auth.store"
import { useWorkspaceStore } from "@/stores/workspace.store"

function hasInviteIntent(path: string | null): boolean {
  if (!path) {
    return false
  }

  return /(^|\/)invite(s|d|r|tion)?(\/|$|\?)/i.test(path)
}

export function PostLoginResolverPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const authStatus = useAuthStore((state) => state.status)
  const lastUsedWorkspace = useAuthStore((state) => state.lastUsedWorkspace)

  const workspaces = useWorkspaceStore((state) => state.workspaces)
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId)
  const setWorkspaces = useWorkspaceStore((state) => state.setWorkspaces)
  const setActiveWorkspace = useWorkspaceStore((state) => state.setActiveWorkspace)

  const { data: fetchedWorkspaces, isPending } = useWorkspacesQuery(authStatus === "authenticated")

  const continuePathFromQuery = normalizeContinuePath(searchParams.get("continue"))

  const continuePath = useMemo(() => {
    if (continuePathFromQuery) {
      return continuePathFromQuery
    }

    return readStoredContinuePath()
  }, [continuePathFromQuery])

  useEffect(() => {
    if (!fetchedWorkspaces) {
      return
    }

    setWorkspaces(fetchedWorkspaces)
  }, [fetchedWorkspaces, setWorkspaces])

  useEffect(() => {
    const fallbackWorkspaceId = workspaces[0]?.id ?? ""
    const preferredWorkspaceId = lastUsedWorkspace?.id ?? fallbackWorkspaceId

    if (!preferredWorkspaceId && isPending) {
      return
    }

    if (preferredWorkspaceId && preferredWorkspaceId !== activeWorkspaceId) {
      setActiveWorkspace(preferredWorkspaceId)
    }

    if (hasInviteIntent(continuePath)) {
      clearStoredContinuePath()
      navigate(continuePath as string, { replace: true })
      return
    }

    if (preferredWorkspaceId) {
      clearStoredContinuePath()
      navigate(continuePath ?? appPaths.workspaceProjects(preferredWorkspaceId), { replace: true })
      return
    }

    clearStoredContinuePath()
    navigate(appPaths.createWorkspace, { replace: true })
  }, [
    activeWorkspaceId,
    continuePath,
    isPending,
    lastUsedWorkspace?.id,
    navigate,
    setActiveWorkspace,
    workspaces,
  ])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        Preparing your workspace...
      </div>
    </div>
  )
}
