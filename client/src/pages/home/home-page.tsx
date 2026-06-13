import { Link, useParams } from "react-router-dom"
import { Folder, Star, CheckCircle } from "lucide-react"
import { useWorkspaceQuery } from "@/features/workspace/use-workspace-query"
import { useProjectsQuery } from "@/features/project/use-projects-query"
import { useWorkspaceMembersQuery } from "@/features/workspace/use-workspace-members-query"

export function HomePage() {
  const { workspaceId = "" } = useParams()

  const { data: workspace, isPending: isWorkspacePending } = useWorkspaceQuery(workspaceId)
  const { data: paginatedData } = useProjectsQuery(workspaceId, { page: 1, size: 20 })
  const { data: members = [] } = useWorkspaceMembersQuery(workspaceId)

  const projects = paginatedData?.projects ?? []
  const favorites = projects.filter((p) => p.isFavorite)

  if (isWorkspacePending) {
    return (
      <div className="mx-auto max-w-5xl px-8 py-12 text-center text-sm text-muted-foreground">
        Loading dashboard...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-12">
      <header className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight">{workspace?.name || "Workspace"}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Projects, members, and settings across your Handit workspace.
        </p>
      </header>

      {/* Summary Stats */}
      <section className="mb-12">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-xs text-muted-foreground">Projects</div>
            <div className="mt-1 text-xl font-semibold tracking-tight">{projects.length}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-xs text-muted-foreground">Members</div>
            <div className="mt-1 text-xl font-semibold tracking-tight">{members.length}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-xs text-muted-foreground">Favorites</div>
            <div className="mt-1 text-xl font-semibold tracking-tight">{favorites.length}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-xs text-muted-foreground">Plan</div>
            <div className="mt-1 text-xl font-semibold tracking-tight capitalize">{workspace?.plan?.toLowerCase()}</div>
          </div>
        </div>
      </section>

      {/* Needs Attention */}
      <section className="mb-12">
        <h2 className="text-sm font-semibold mb-3">Needs attention</h2>
        <div className="flex items-center gap-3 rounded-lg border bg-card px-5 py-6 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>Everything looks good. No action required.</span>
        </div>
      </section>

      {/* Favorites / Projects summary */}
      <section className="mb-12">
        <h2 className="text-sm font-semibold mb-3">Favorite projects</h2>
        {favorites.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No favorite projects. Mark projects with star to show them here.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {favorites.map((p) => (
              <Link
                key={p.id}
                to={`/w/${workspaceId}/projects`}
                className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 truncate">
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate font-medium">{p.name}</span>
                  </div>
                  <Star className="h-4 w-4 fill-warning text-warning shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
