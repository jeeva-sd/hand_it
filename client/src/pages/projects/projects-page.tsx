import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { appPaths } from "@/app/router/paths"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useProjectsQuery } from "@/features/project/use-projects-query"
import { cn } from "@/lib/utils"
import { useWorkspaceStore } from "@/stores/workspace.store"
import type {
  ActivityType,
  Project,
  ProjectActivity,
  ProjectFileSection,
  ProjectShare,
  WorkspaceFile,
} from "@/types/workspace"
import {
  ArrowUpDownIcon,
  CalendarIcon,
  CheckCircle2Icon,
  Clock3Icon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  Grid2x2Icon,
  HistoryIcon,
  ImageIcon,
  Link2Icon,
  ListIcon,
  MoreHorizontalIcon,
  PenToolIcon,
  PencilIcon,
  RefreshCcwIcon,
  RotateCcwIcon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
  VideoIcon,
} from "lucide-react"
import { useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

type DirectoryFilter = "active" | "archived" | "favorites"
type DirectoryView = "grid" | "list"
type ProjectTab = "files" | "shares" | "activity"
type FilesView = "list" | "grid"
type FileSort = "name" | "date" | "size"

const projectTabs: ProjectTab[] = ["files", "shares", "activity"]

function getFileIcon(type: WorkspaceFile["type"]) {
  switch (type) {
    case "video":
      return <VideoIcon className="size-4 text-primary" />
    case "image":
      return <ImageIcon className="size-4 text-primary" />
    case "design":
      return <PenToolIcon className="size-4 text-primary" />
    default:
      return <FileTextIcon className="size-4 text-primary" />
  }
}

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case "upload":
      return <UploadIcon className="size-4 text-primary" />
    case "view":
      return <EyeIcon className="size-4 text-primary" />
    case "snapshot":
      return <Link2Icon className="size-4 text-primary" />
    case "restore":
      return <RotateCcwIcon className="size-4 text-primary" />
    default:
      return <Clock3Icon className="size-4 text-primary" />
  }
}

function FileActionsMenu({ onVersionHistory }: { onVersionHistory: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Open file actions">
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-44 rounded-xl border border-border" align="end">
        <DropdownMenuItem>
          <DownloadIcon />
          Download
        </DropdownMenuItem>
        <DropdownMenuItem>
          <PencilIcon />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem>
          <RefreshCcwIcon />
          Replace File
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onVersionHistory}>
          <HistoryIcon />
          Version History
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive">
          <Trash2Icon />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function sortFiles(files: WorkspaceFile[], sortBy: FileSort) {
  return [...files].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name)
    }

    if (sortBy === "size") {
      return b.sizeBytes - a.sizeBytes
    }

    return b.updatedAtEpoch - a.updatedAtEpoch
  })
}

function FilesTab({ sections }: { sections: ProjectFileSection[] }) {
  const [view, setView] = useState<FilesView>("list")
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<FileSort>("date")
  const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(null)

  const filteredSections = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return sections
      .map((section) => {
        const filteredFiles = section.files.filter((file) => {
          if (normalizedSearch.length === 0) {
            return true
          }

          return file.name.toLowerCase().includes(normalizedSearch)
        })

        return {
          ...section,
          files: sortFiles(filteredFiles, sortBy),
        }
      })
      .filter((section) => section.files.length > 0)
  }, [search, sections, sortBy])

  const sortLabel = sortBy === "name" ? "Name" : sortBy === "size" ? "Size" : "Date"

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 md:flex-row md:items-center md:p-4">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search files"
            className="h-9 rounded-xl pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <ArrowUpDownIcon className="size-4" />
                Sort: {sortLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-40 rounded-xl border border-border" align="end">
              <DropdownMenuItem onClick={() => setSortBy("name")}>Name</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("date")}>Date</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("size")}>Size</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="inline-flex rounded-xl border border-border bg-background p-1">
            <Button variant={view === "list" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setView("list")}>
              <ListIcon className="size-4" />
            </Button>
            <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setView("grid")}>
              <Grid2x2Icon className="size-4" />
            </Button>
          </div>

          <Button>
            <UploadIcon className="size-4" />
            Upload
          </Button>
        </div>
      </div>

      {filteredSections.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">No files match your search.</p>
        </div>
      )}

      {filteredSections.map((section) => (
        <article key={section.id} className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">{section.title}</h3>

          {view === "list" && (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="hidden grid-cols-[minmax(0,1.7fr)_0.9fr_1fr_0.7fr_auto] gap-3 border-b border-border/70 px-4 py-2 text-xs text-muted-foreground md:grid">
                <span>Name</span>
                <span>Version</span>
                <span>Last Updated</span>
                <span>Size</span>
                <span className="text-right">Actions</span>
              </div>

              {section.files.map((file) => (
                <div
                  key={file.id}
                  className="grid gap-2 border-b border-border/60 px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1.7fr)_0.9fr_1fr_0.7fr_auto] md:items-center"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedFile(file)}
                    className="flex min-w-0 items-center gap-3 text-left"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-background">
                      {getFileIcon(file.type)}
                    </span>
                    <span className="truncate text-sm font-medium">{file.name}</span>
                  </button>
                  <span className="text-sm text-muted-foreground">{file.currentVersion}</span>
                  <span className="text-sm text-muted-foreground">{file.updatedAt}</span>
                  <span className="text-sm text-muted-foreground">{file.sizeLabel}</span>
                  <div className="ml-auto">
                    <FileActionsMenu onVersionHistory={() => setSelectedFile(file)} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === "grid" && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {section.files.map((file) => (
                <div key={file.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedFile(file)}
                      className="flex min-w-0 items-center gap-3 text-left"
                    >
                      <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-background">
                        {getFileIcon(file.type)}
                      </span>
                      <span className="truncate text-sm font-medium">{file.name}</span>
                    </button>
                    <FileActionsMenu onVersionHistory={() => setSelectedFile(file)} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <p>Version {file.currentVersion}</p>
                    <p className="text-right">{file.sizeLabel}</p>
                    <p>{file.updatedAt}</p>
                    <p className="text-right">Updated</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      ))}

      <Sheet open={selectedFile !== null} onOpenChange={(open) => !open && setSelectedFile(null)}>
        <SheetContent side="right" className="w-full max-w-xl gap-0 p-0">
          {selectedFile && (
            <>
              <SheetHeader className="border-b border-border/80 p-5">
                <SheetTitle>{selectedFile.name}</SheetTitle>
                <SheetDescription>File preview and version history</SheetDescription>
              </SheetHeader>

              <div className="space-y-5 overflow-y-auto p-5">
                <section className="rounded-2xl border border-border bg-muted/35 p-4">
                  <p className="text-xs font-medium text-muted-foreground">File Preview</p>
                  <div className="mt-3 flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border bg-background">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      {getFileIcon(selectedFile.type)}
                      <p className="text-xs">Upload files to preview versions here.</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Version History</p>
                  {selectedFile.versions.map((version) => (
                    <article
                      key={version.id}
                      className={cn(
                        "rounded-2xl border border-border bg-card p-4",
                        version.isCurrent && "border-primary/40 bg-primary/5"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="flex items-center gap-2 text-sm font-medium">
                            {version.label}
                            {version.isCurrent && <Badge>Current</Badge>}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Uploaded by {version.uploadedBy} · {version.uploadedAt}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button variant="outline" size="xs">
                          Download Version
                        </Button>
                        <Button variant="outline" size="xs">
                          Restore Version
                        </Button>
                        <Button variant="outline" size="xs">
                          Create Snapshot Link
                        </Button>
                      </div>
                    </article>
                  ))}
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </section>
  )
}

function SharesTab({ projectId: _projectId }: { projectId: string }) {
  const shares: ProjectShare[] = []

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
        <div>
          <h3 className="text-base font-medium">Share Links</h3>
          <p className="text-sm text-muted-foreground">Dynamic links update automatically, snapshots stay frozen.</p>
        </div>
        <Button>
          <Link2Icon className="size-4" />
          Create Share Link
        </Button>
      </div>

      {shares.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">No shares created for this project yet.</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {shares.map((share) => (
          <article key={share.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{share.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant={share.type === "Dynamic Share" ? "default" : "outline"}>{share.type}</Badge>
                  {share.passwordProtected && <Badge variant="outline">Password Protected</Badge>}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontalIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-40 rounded-xl border border-border" align="end">
                  <DropdownMenuItem>Copy Link</DropdownMenuItem>
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Disable</DropdownMenuItem>
                  <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <p className="flex items-center gap-1">
                <CalendarIcon className="size-3.5" />
                Created {share.createdAt}
              </p>
              <p className="text-right">Expiry {share.expiresAt}</p>
              <p className="flex items-center gap-1">
                <EyeIcon className="size-3.5" />
                {share.viewCount} views
              </p>
              <p className="text-right">{share.downloadCount} downloads</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                Copy Link
              </Button>
              <Button variant="outline" size="sm">
                Edit
              </Button>
              <Button variant="outline" size="sm">
                Disable
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function ActivityTab({ projectId: _projectId }: { projectId: string }) {
  const activity: ProjectActivity[] = []

  return (
    <section className="rounded-2xl border border-border bg-card p-4 md:p-5">
      {activity.length === 0 && <p className="text-sm text-muted-foreground">No recent activity yet.</p>}

      <ol className="space-y-4">
        {activity.map((entry) => (
          <li key={entry.id} className="flex gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-background">
              {getActivityIcon(entry.type)}
            </span>
            <div className="min-w-0 rounded-xl border border-border/70 bg-background px-3 py-2">
              <p className="text-sm">{entry.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">{entry.createdAt}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function ProjectWorkspace({
  project,
  activeTab,
  onTabChange,
}: {
  project: Project
  activeTab: ProjectTab
  onTabChange: (tab: ProjectTab) => void
}) {

  const sections: ProjectFileSection[] = []

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{project.name}</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{project.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant={project.status === "Archived" ? "outline" : "default"}>{project.status}</Badge>
              <span className="flex items-center gap-1">
                <Clock3Icon className="size-3.5" />
                Last updated {project.updatedAt}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button>
              <UploadIcon className="size-4" />
              Upload Files
            </Button>
            <Button variant="outline">
              <Link2Icon className="size-4" />
              Create Share Link
            </Button>
          </div>
        </div>
      </header>

      <nav className="flex items-center gap-1 rounded-xl border border-border bg-card p-1" aria-label="Project sections">
        {projectTabs.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "secondary" : "ghost"}
            className="capitalize"
            onClick={() => onTabChange(tab)}
          >
            {tab}
          </Button>
        ))}
      </nav>

      {activeTab === "files" && <FilesTab sections={sections} />}
      {activeTab === "shares" && <SharesTab projectId={project.id} />}
      {activeTab === "activity" && <ActivityTab projectId={project.id} />}
    </section>
  )
}

function ProjectsDirectory({ projects, workspaceId }: { projects: Project[]; workspaceId: string }) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<DirectoryFilter>("active")
  const [view, setView] = useState<DirectoryView>("grid")

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return projects.filter((project) => {
      if (filter === "archived" && project.status !== "Archived") {
        return false
      }

      if (filter === "favorites" && !project.isFavorite) {
        return false
      }

      if (filter === "active" && project.status === "Archived") {
        return false
      }

      if (normalizedQuery.length === 0) {
        return true
      }

      return project.name.toLowerCase().includes(normalizedQuery)
    })
  }, [filter, projects, query])

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-2xl font-semibold">All Projects</h2>
        <p className="mt-2 text-sm text-muted-foreground">Search across every project and jump straight into delivery work.</p>

        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects"
              className="h-9 rounded-xl pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant={filter === "active" ? "secondary" : "outline"} onClick={() => setFilter("active")}>
              Active
            </Button>
            <Button variant={filter === "archived" ? "secondary" : "outline"} onClick={() => setFilter("archived")}>
              Archived
            </Button>
            <Button variant={filter === "favorites" ? "secondary" : "outline"} onClick={() => setFilter("favorites")}>
              Favorites
            </Button>
          </div>

          <div className="inline-flex rounded-xl border border-border bg-background p-1 xl:ml-auto">
            <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setView("grid")}>
              <Grid2x2Icon className="size-4" />
            </Button>
            <Button variant={view === "list" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setView("list")}>
              <ListIcon className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {filteredProjects.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No projects match your filters.
        </div>
      )}

      {view === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              to={appPaths.workspaceProjectSection(workspaceId, project.id, "files")}
              className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-semibold">{project.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
                </div>
                {project.isFavorite && <Badge variant="outline">Favorite</Badge>}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <p>{project.fileCount} files</p>
                <p className="text-right">{project.shareCount} shares</p>
                <p>Updated {project.updatedAt}</p>
                <p className="text-right">{project.members.length} members</p>
              </div>

              <div className="mt-4 flex -space-x-2">
                {project.members.slice(0, 4).map((member) => (
                  <span
                    key={`${project.id}-${member}`}
                    className="flex size-7 items-center justify-center rounded-full border border-border bg-background text-[0.65rem] font-medium"
                    title={member}
                  >
                    {member.slice(0, 2).toUpperCase()}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}

      {view === "list" && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              to={appPaths.workspaceProjectSection(workspaceId, project.id, "files")}
              className="grid gap-2 border-b border-border/70 px-4 py-3 transition-colors hover:bg-muted/30 last:border-b-0 md:grid-cols-[minmax(0,1.6fr)_0.8fr_0.8fr_1fr_1fr] md:items-center"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{project.name}</p>
                <p className="truncate text-xs text-muted-foreground">{project.description}</p>
              </div>
              <p className="text-sm text-muted-foreground">{project.fileCount} files</p>
              <p className="text-sm text-muted-foreground">{project.shareCount} shares</p>
              <p className="text-sm text-muted-foreground">Updated {project.updatedAt}</p>
              <p className="text-sm text-muted-foreground">{project.members.join(", ")}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

type ProjectsPageProps = {
  projectTab?: ProjectTab
}

export function ProjectsPage({ projectTab }: ProjectsPageProps) {
  const navigate = useNavigate()
  const { workspaceId = "", projectId } = useParams()
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId)
  const currentWorkspaceId = workspaceId || activeWorkspaceId || ""

  const { data: projects = [], isLoading } = useProjectsQuery(currentWorkspaceId)

  if (!currentWorkspaceId) {
    return (
      <section className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Loading workspace context...
      </section>
    )
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Loading projects...
      </section>
    )
  }

  if (!projectId) {
    return <ProjectsDirectory projects={projects} workspaceId={currentWorkspaceId} />
  }

  const selectedProject = projects.find((project) => project.id === projectId)

  if (!selectedProject) {
    return (
      <section className="rounded-2xl border border-dashed border-border p-10 text-center">
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          <CheckCircle2Icon className="size-8 text-muted-foreground" />
          <h2 className="text-lg font-medium">Project not found in this workspace</h2>
          <p className="text-sm text-muted-foreground">
            Try selecting a different workspace from the sidebar or open the full project directory.
          </p>
          <Button asChild>
            <Link to={appPaths.workspaceProjects(currentWorkspaceId)}>Open All Projects</Link>
          </Button>
        </div>
      </section>
    )
  }

  const activeTab = projectTab ?? "files"

  const handleTabChange = (tab: ProjectTab) => {
    navigate(appPaths.workspaceProjectSection(currentWorkspaceId, selectedProject.id, tab))
  }

  return <ProjectWorkspace project={selectedProject} activeTab={activeTab} onTabChange={handleTabChange} />
}
