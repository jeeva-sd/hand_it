import { useState } from "react"
import { useParams } from "react-router-dom"
import { Search, LayoutGrid, List, Plus, Star, Folder, Share2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useProjectsQuery } from "@/features/project/use-projects-query"

type Filter = "all" | "active" | "archived" | "favorites"

export function ProjectsPage() {
  const { workspaceId = "" } = useParams()
  const [view, setView] = useState<"grid" | "list">("grid")
  const [filter, setFilter] = useState<Filter>("all")
  const [q, setQ] = useState("")

  const { data: paginatedData, isPending, isError } = useProjectsQuery(workspaceId, {
    page: 1,
    size: 50,
  })

  const projects = paginatedData?.projects ?? []

  const filtered = projects.filter((p) => {
    if (filter === "active" && p.status !== "Active") return false
    if (filter === "archived" && p.status !== "Archived") return false
    if (filter === "favorites" && !p.isFavorite) return false
    if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  if (isPending) {
    return (
      <div className="mx-auto max-w-7xl px-8 py-10 text-center text-sm text-muted-foreground">
        Loading projects...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl px-8 py-10 text-center text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
        Unable to load projects. Please refresh and try again.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All workspace and project folders across Handit.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> New Project
        </Button>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md border bg-card p-0.5">
          {(["all", "active", "archived", "favorites"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded px-3 py-1 text-xs font-medium capitalize transition-colors",
                filter === f
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-md border bg-card p-0.5">
          <button
            onClick={() => setView("grid")}
            className={cn(
              "rounded p-1.5",
              view === "grid" ? "bg-secondary" : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "rounded p-1.5",
              view === "list" ? "bg-secondary" : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground bg-card">
          No projects found.
        </div>
      )}

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="group rounded-lg border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Folder className="h-5 w-5" />
                </div>
                {p.isFavorite && <Star className="h-4 w-4 fill-warning text-warning" />}
              </div>
              <h3 className="font-semibold text-foreground truncate">{p.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description || "No description provided."}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Folder className="h-3 w-3" /> {p.fileCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Share2 className="h-3 w-3" /> {p.shareCount || 0}
                  </span>
                </div>
                <div className="flex -space-x-1.5">
                  {p.members?.slice(0, 3).map((m, idx) => (
                    <Avatar key={idx} className="h-6 w-6 border-2 border-card">
                      <AvatarFallback className="bg-secondary text-[10px]">{m.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )) || null}
                </div>
              </div>
              <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                Updated {p.updatedAt}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Files</th>
                <th className="px-4 py-3 text-left font-medium">Shares</th>
                <th className="px-4 py-3 text-left font-medium">Members</th>
                <th className="px-4 py-3 text-left font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-accent/40">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium">
                      {p.isFavorite && <Star className="h-3.5 w-3.5 fill-warning text-warning" />}
                      {p.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="font-normal">
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.fileCount || 0}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.shareCount || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex -space-x-1.5">
                      {p.members?.slice(0, 3).map((m, idx) => (
                        <Avatar key={idx} className="h-6 w-6 border-2 border-card">
                          <AvatarFallback className="bg-secondary text-[10px]">{m.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      )) || null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
