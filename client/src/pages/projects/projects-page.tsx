/* eslint-disable react-hooks/set-state-in-effect */
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
import { useProjectQuery } from "@/features/project/use-project-query"
import { useProjectsQuery } from "@/features/project/use-projects-query"
import { useWorkspaceQuery } from "@/features/workspace/use-workspace-query"
import { cn } from "@/lib/utils"
import { ApiError } from "@/services/http.service"
import { createProject, updateProject, deleteProject, favoriteProject, unfavoriteProject } from "@/services/project.service"
import type {
  ActivityType,
  Project,
  ProjectActivity,
  ProjectFileSection,
  ProjectShare,
  WorkspaceFile,
} from "@/types/workspace"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
  Loader2Icon,
  MoreHorizontalIcon,
  PenToolIcon,
  PencilIcon,
  RefreshCcwIcon,
  RotateCcwIcon,
  SearchIcon,
  StarIcon,
  Trash2Icon,
  UploadIcon,
  VideoIcon,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
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

function SharesTab() {
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

function ActivityTab() {
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
  onOpenEditSheet,
  onDeleteProject,
  isMutating,
  onToggleFavorite,
}: {
  project: Project
  activeTab: ProjectTab
  onTabChange: (tab: ProjectTab) => void
  onOpenEditSheet: () => void
  onDeleteProject: () => void
  isMutating: boolean
  onToggleFavorite: () => void
}) {
  const sections: ProjectFileSection[] = []

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold">{project.name}</h2>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onToggleFavorite}
                aria-label={project.isFavorite ? "Unfavorite Project" : "Favorite Project"}
                className={cn(
                  project.isFavorite
                    ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <StarIcon className={cn("size-4", project.isFavorite && "fill-current")} />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={onOpenEditSheet} aria-label="Edit Project">
                <PencilIcon className="size-4 text-muted-foreground hover:text-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={onDeleteProject}
                disabled={isMutating}
                aria-label="Delete Project"
              >
                {isMutating ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <Trash2Icon className="size-4" />
                )}
              </Button>
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground">{project.description}</p>
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
      {activeTab === "shares" && <SharesTab />}
      {activeTab === "activity" && <ActivityTab />}
    </section>
  )
}

interface ProjectsDirectoryProps {
  projects: Project[]
  workspaceId: string
  query: string
  setQuery: (q: string) => void
  filter: DirectoryFilter
  setFilter: (f: DirectoryFilter) => void
  page: number
  setPage: (p: number) => void
  totalPages: number
  totalItems: number
  onOpenCreateSheet: () => void
  onToggleFavorite: (id: string, isFavorite: boolean) => void
}

function ProjectsDirectory({
  projects,
  workspaceId,
  query,
  setQuery,
  filter,
  setFilter,
  page,
  setPage,
  totalPages,
  totalItems,
  onOpenCreateSheet,
  onToggleFavorite,
}: ProjectsDirectoryProps) {
  const [view, setView] = useState<DirectoryView>("grid")

  // For locally hardcoded fields like favorites filters, we can refine search further
  const processedProjects = useMemo(() => {
    return projects.filter((project) => {
      if (filter === "favorites" && !project.isFavorite) {
        return false // If favoritism gets built later, it works
      }
      return true
    })
  }, [projects, filter])

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold">All Projects</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Search across every project and jump straight into delivery work.
            </p>
          </div>
          <Button onClick={onOpenCreateSheet} className="md:self-start">
            Create Project
          </Button>
        </div>

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
            <Button
              variant={filter === "active" ? "secondary" : "outline"}
              onClick={() => {
                setFilter("active")
                setPage(1)
              }}
            >
              Active
            </Button>
            <Button
              variant={filter === "archived" ? "secondary" : "outline"}
              onClick={() => {
                setFilter("archived")
                setPage(1)
              }}
            >
              Archived
            </Button>
            <Button
              variant={filter === "favorites" ? "secondary" : "outline"}
              onClick={() => {
                setFilter("favorites")
                setPage(1)
              }}
            >
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

      {processedProjects.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No projects match your filters.
        </div>
      )}

      {view === "grid" && processedProjects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {processedProjects.map((project) => (
            <Link
              key={project.id}
              to={appPaths.workspaceProjectSection(workspaceId, project.id, "files")}
              className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 relative group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-base font-semibold truncate">{project.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onToggleFavorite(project.id, project.isFavorite)
                    }}
                    className={cn(
                      "rounded-lg",
                      project.isFavorite
                        ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <StarIcon className={cn("size-4", project.isFavorite && "fill-current")} />
                  </Button>
                </div>
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

      {view === "list" && processedProjects.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {processedProjects.map((project) => (
            <Link
              key={project.id}
              to={appPaths.workspaceProjectSection(workspaceId, project.id, "files")}
              className="grid gap-2 border-b border-border/70 px-4 py-3 transition-colors hover:bg-muted/30 last:border-b-0 md:grid-cols-[auto_minmax(0,1.6fr)_0.8fr_0.8fr_1fr_1fr] md:items-center"
            >
              <div className="flex items-center shrink-0">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onToggleFavorite(project.id, project.isFavorite)
                  }}
                  className={cn(
                    "rounded-lg",
                    project.isFavorite
                      ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <StarIcon className={cn("size-4", project.isFavorite && "fill-current")} />
                </Button>
              </div>
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

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-4 pb-2">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-medium">{processedProjects.length}</span> of{" "}
            <span className="font-medium">{totalItems}</span> projects.
          </p>
          <div className="flex items-center gap-3 self-center sm:self-auto">
            <Button
              variant="outline"
              size="xs"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-xs font-medium">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="xs"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </footer>
      )}
    </section>
  )
}

type ProjectsPageProps = {
  projectTab?: ProjectTab
}

export function ProjectsPage({ projectTab }: ProjectsPageProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { workspaceId = "", projectId = "" } = useParams()

  const hasProjectRoute = projectId.length > 0
  const workspaceQuery = useWorkspaceQuery(workspaceId)

  // PAGINATION, SEARCH, AND FILTER STATES
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [filter, setFilter] = useState<DirectoryFilter>("active")
  const [sortOrder] = useState<"asc" | "desc">("desc")

  // Sheet states
  const [openCreateSheet, setOpenCreateSheet] = useState(false)
  const [createSchemaError, setCreateSchemaError] = useState<string | null>(null)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDesc, setNewProjectDesc] = useState("")

  const [openEditSheet, setOpenEditSheet] = useState(false)
  const [editSchemaError, setEditSchemaError] = useState<string | null>(null)
  const [editProjectName, setEditProjectName] = useState("")
  const [editProjectDesc, setEditProjectDesc] = useState("")
  const [editProjectStatus, setEditProjectStatus] = useState<string>("Active")

  // Search Debouncer
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1) // reset on filter search
    }, 450)
    return () => clearTimeout(handler)
  }, [searchTerm])

  const isWorkspaceReady = workspaceId.length > 0

  // 1. Paginated & Filtered listing query
  const projectsQuery = useProjectsQuery(workspaceId, {
    enabled: !hasProjectRoute && isWorkspaceReady,
    page,
    size: 6, // 6 items per page
    searchTerm: debouncedSearch,
    status: filter === "favorites" ? "all" : filter,
    sortOrder,
  })

  // 2. Single Project detail query
  const projectQuery = useProjectQuery(
    workspaceId,
    hasProjectRoute ? projectId : "",
    hasProjectRoute && isWorkspaceReady
  )

  const isProjectNotFound =
    hasProjectRoute &&
    projectQuery.isError &&
    projectQuery.error instanceof ApiError &&
    projectQuery.error.status === 404

  // Reset page when switching workspaces or filters
  useEffect(() => {
    setPage(1)
    setSearchTerm("")
  }, [workspaceId, filter])

  // Redirect on project not found
  useEffect(() => {
    if (!hasProjectRoute || !isProjectNotFound || !workspaceId) {
      return
    }

    navigate(appPaths.workspaceProjects(workspaceId), { replace: true })
  }, [hasProjectRoute, isProjectNotFound, navigate, workspaceId])

  // Mutation: CREATE Project
  const createMutation = useMutation({
    mutationFn: (payload: { name: string; description: string }) =>
      createProject(workspaceId, {
        name: payload.name,
        description: payload.description,
        status: "ACTIVE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId, "projects"] })
      setOpenCreateSheet(false)
      setNewProjectName("")
      setNewProjectDesc("")
      setCreateSchemaError(null)
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setCreateSchemaError(err.message)
      } else {
        setCreateSchemaError("Failed to create project. Please try again.")
      }
    },
  })

  // Mutation: UPDATE Project
  const updateMutation = useMutation({
    mutationFn: (payload: { name: string; description: string; status: string }) =>
      updateProject(workspaceId, projectId, {
        name: payload.name,
        description: payload.description,
        status: payload.status.toUpperCase(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId, "projects"] })
      setOpenEditSheet(false)
      setEditSchemaError(null)
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setEditSchemaError(err.message)
      } else {
        setEditSchemaError("Failed to update project. Please try again.")
      }
    },
  })

  // Mutation: DELETE Project
  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(workspaceId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId, "projects"] })
      navigate(appPaths.workspaceProjects(workspaceId))
    },
    onError: () => {
      alert("Failed to delete project. Please try again.")
    },
  })

  // Mutation: TOGGLE FAVORITE
  const favoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      if (isFavorite) {
        return unfavoriteProject(workspaceId, id)
      } else {
        return favoriteProject(workspaceId, id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId, "projects"] })
    },
    onError: () => {
      alert("Failed to update favorite status. Please try again.")
    },
  })

  // Prefill edit form when sheet opens
  useEffect(() => {
    if (projectQuery.data && openEditSheet) {
      setEditProjectName(projectQuery.data.name)
      setEditProjectDesc(projectQuery.data.description ?? "")
      setEditProjectStatus(projectQuery.data.status)
    }
  }, [projectQuery.data, openEditSheet])

  if (!workspaceId) {
    return (
      <section className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Workspace route is missing. Please open a workspace URL.
      </section>
    )
  }

  if (workspaceQuery.isLoading) {
    return (
      <section className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Loading workspace...
      </section>
    )
  }

  if (workspaceQuery.isError || !workspaceQuery.data) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-sm text-red-700">
        Unable to load this workspace from URL right now. Please refresh and try again.
      </section>
    )
  }

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCreateSchemaError(null)
    if (!newProjectName.trim()) {
      setCreateSchemaError("Project name is required")
      return
    }
    createMutation.mutate({ name: newProjectName.trim(), description: newProjectDesc.trim() })
  }

  const handleEditProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEditSchemaError(null)
    if (!editProjectName.trim()) {
      setEditSchemaError("Project name is required")
      return
    }
    updateMutation.mutate({
      name: editProjectName.trim(),
      description: editProjectDesc.trim(),
      status: editProjectStatus,
    })
  }

  const handleDeleteProject = () => {
    if (confirm("Are you sure you want to permanently delete this project? All associated file registries and history will be lost.")) {
      deleteMutation.mutate()
    }
  }

  if (!hasProjectRoute) {
    if (projectsQuery.isLoading) {
      return (
        <section className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading projects...
        </section>
      )
    }

    if (projectsQuery.isError) {
      return (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-sm text-red-700">
          Unable to load projects for this workspace right now. Please refresh and try again.
        </section>
      )
    }

    const { projects = [], meta } = projectsQuery.data ?? {}

    return (
      <>
        <ProjectsDirectory
          projects={projects}
          workspaceId={workspaceId}
          query={searchTerm}
          setQuery={setSearchTerm}
          filter={filter}
          setFilter={setFilter}
          page={page}
          setPage={setPage}
          totalPages={meta?.totalPages ?? 1}
          totalItems={meta?.totalItems ?? 0}
          onOpenCreateSheet={() => setOpenCreateSheet(true)}
          onToggleFavorite={(id, isFavorite) => favoriteMutation.mutate({ id, isFavorite })}
        />

        {/* Create Project Sheet */}
        <Sheet open={openCreateSheet} onOpenChange={setOpenCreateSheet}>
          <SheetContent side="right" className="w-full max-w-xl p-6">
            <SheetHeader className="pb-5 border-b border-border/80">
              <SheetTitle>Create New Project</SheetTitle>
              <SheetDescription>Set up a clean space for uploading and delivering directories.</SheetDescription>
            </SheetHeader>
            <form onSubmit={handleCreateProjectSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="pname" className="text-sm font-medium">Project Name</label>
                <Input
                  id="pname"
                  placeholder="e.g. Q2 Marketing Assets"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="pdesc" className="text-sm font-medium">Description</label>
                <textarea
                  id="pdesc"
                  rows={4}
                  placeholder="Tell your team what this directory is for."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  maxLength={500}
                />
              </div>

              {createSchemaError && (
                <p className="text-xs text-red-500 rounded-lg bg-red-50 border border-red-100 p-2.5">
                  {createSchemaError}
                </p>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpenCreateSheet(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  if (projectQuery.isLoading) {
    return (
      <section className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Loading project...
      </section>
    )
  }

  if (isProjectNotFound) {
    return (
      <section className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Project not found in this workspace. Redirecting to projects...
      </section>
    )
  }

  if (projectQuery.isError) {
    return (
      <section className="rounded-2xl border border-dashed border-border p-10 text-center">
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          <CheckCircle2Icon className="size-8 text-muted-foreground" />
          <h2 className="text-lg font-medium">Unable to load project</h2>
          <p className="text-sm text-muted-foreground">Please refresh and try again.</p>
          <Button asChild>
            <Link to={appPaths.workspaceProjects(workspaceId)}>Open All Projects</Link>
          </Button>
        </div>
      </section>
    )
  }

  const selectedProject = projectQuery.data

  if (!selectedProject) {
    return (
      <section className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Loading project...
      </section>
    )
  }

  const activeTab = projectTab ?? "files"

  const handleTabChange = (tab: ProjectTab) => {
    navigate(appPaths.workspaceProjectSection(workspaceId, selectedProject.id, tab))
  }

  return (
    <>
      <ProjectWorkspace
        project={selectedProject}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenEditSheet={() => setOpenEditSheet(true)}
        onDeleteProject={handleDeleteProject}
        isMutating={deleteMutation.isPending}
        onToggleFavorite={() =>
          favoriteMutation.mutate({ id: selectedProject.id, isFavorite: selectedProject.isFavorite })
        }
      />

      {/* Edit Project Sheet */}
      <Sheet open={openEditSheet} onOpenChange={setOpenEditSheet}>
        <SheetContent side="right" className="w-full max-w-xl p-6">
          <SheetHeader className="pb-5 border-b border-border/80">
            <SheetTitle>Edit Project</SheetTitle>
            <SheetDescription>Configure status, descriptions, and name of your project workspace.</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleEditProjectSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="peditname" className="text-sm font-medium">Project Name</label>
              <Input
                id="peditname"
                placeholder="Project Name"
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
                maxLength={120}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="peditdesc" className="text-sm font-medium">Description</label>
              <textarea
                id="peditdesc"
                rows={4}
                placeholder="Description"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus:ring-1 focus:ring-ring"
                value={editProjectDesc}
                onChange={(e) => setEditProjectDesc(e.target.value)}
                maxLength={500}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="peditstatus" className="text-sm font-medium">Status</label>
              <select
                id="peditstatus"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus:ring-1 focus:ring-ring"
                value={editProjectStatus}
                onChange={(e) => setEditProjectStatus(e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            {editSchemaError && (
              <p className="text-xs text-red-500 rounded-lg bg-red-50 border border-red-100 p-2.5">
                {editSchemaError}
              </p>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpenEditSheet(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
