import { Loader2Icon } from "lucide-react"
import { Navigate, useLocation, useParams } from "react-router-dom"

import { appPaths, isProjectSection, type ProjectSection } from "@/app/router/paths"
import { useResolvedWorkspaceId } from "@/app/router/use-resolved-workspace-id"

type LegacyRedirectTarget = "projects" | "project" | "settings" | "members" | "billing"

type LegacyWorkspaceRedirectProps = {
  target: LegacyRedirectTarget
}

function resolveProjectSectionFromQuery(value: string | null): ProjectSection {
  if (isProjectSection(value)) {
    return value
  }

  return "files"
}

export function LegacyWorkspaceRedirect({ target }: LegacyWorkspaceRedirectProps) {
  const location = useLocation()
  const { projectId = "" } = useParams()
  const { isHydrating, resolvedWorkspaceId, workspaces } = useResolvedWorkspaceId()

  if (isHydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Preparing your workspace...
        </div>
      </div>
    )
  }

  if (workspaces.length === 0 && resolvedWorkspaceId.length === 0) {
    return <Navigate to={appPaths.createWorkspace} replace />
  }

  if (!resolvedWorkspaceId) {
    return <Navigate to={appPaths.createWorkspace} replace />
  }

  if (target === "project") {
    const section = resolveProjectSectionFromQuery(new URLSearchParams(location.search).get("tab"))

    if (!projectId) {
      return <Navigate to={appPaths.workspaceProjects(resolvedWorkspaceId)} replace />
    }

    return <Navigate to={appPaths.workspaceProjectSection(resolvedWorkspaceId, projectId, section)} replace />
  }

  if (target === "settings") {
    return <Navigate to={appPaths.workspaceSettings(resolvedWorkspaceId)} replace />
  }

  if (target === "members") {
    return <Navigate to={appPaths.workspaceMembers(resolvedWorkspaceId)} replace />
  }

  if (target === "billing") {
    return <Navigate to={appPaths.workspaceBilling(resolvedWorkspaceId)} replace />
  }

  return <Navigate to={appPaths.workspaceProjects(resolvedWorkspaceId)} replace />
}