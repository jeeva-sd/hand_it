import { Badge } from "@/components/ui/badge"
import { useProjectsQuery } from "@/features/project/use-projects-query"
import { useWorkspaceStore } from "@/stores/workspace.store"

export function HomePage() {
  const workspaces = useWorkspaceStore((state) => state.workspaces)
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId)

  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0]

  const { data: projects = [] } = useProjectsQuery(activeWorkspaceId)

  return (
    <section className="space-y-4">
      <div>
        <Badge variant="outline" className="border-border bg-surface-raised text-text-secondary">
          Minimal workspace dashboard
        </Badge>
        <h2 className="mt-3 text-2xl font-semibold">{activeWorkspace?.name ?? "Workspace"}</h2>
        <p className="mt-1 text-sm text-text-muted">
          A light and quick layout with sidebar context visible at all times.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted">Projects</p>
          <p className="mt-1 text-2xl font-semibold">{projects.length}</p>
        </article>

        <article className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted">Members</p>
          <p className="mt-1 text-2xl font-semibold">{activeWorkspace?.memberCount ?? 0}</p>
        </article>

        <article className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted">Plan</p>
          <p className="mt-1 text-2xl font-semibold">{activeWorkspace?.plan ?? "Free"}</p>
        </article>
      </div>
    </section>
  )
}
