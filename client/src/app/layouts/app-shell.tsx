import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useProjectsQuery } from "@/features/project/use-projects-query"
import {
  workspaceFavoriteProjectIds,
  workspaceRecentProjectIds,
} from "@/features/workspace/workspace.data"
import { logoutSession } from "@/services/auth.service"
import { useAuthStore } from "@/stores/auth.store"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { useEffect, useMemo } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/projects/") && pathname.split("/").length > 2) {
    return "Project"
  }

  if (pathname.startsWith("/projects")) {
    return "All Projects"
  }

  if (pathname.startsWith("/settings")) {
    return "Workspace"
  }

  return "Dashboard"
}

export function AppShellLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  const authUser = useAuthStore((state) => state.user)
  const lastUsedWorkspace = useAuthStore((state) => state.lastUsedWorkspace)
  const clearSession = useAuthStore((state) => state.clearSession)

  const workspaces = useWorkspaceStore((state) => state.workspaces)
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId)
  const setActiveWorkspace = useWorkspaceStore((state) => state.setActiveWorkspace)

  useEffect(() => {
    if (!lastUsedWorkspace?.id) {
      return
    }

    setActiveWorkspace(lastUsedWorkspace.id)
  }, [lastUsedWorkspace?.id, setActiveWorkspace])

  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0]

  const { data: projects = [] } = useProjectsQuery(activeWorkspaceId)

  const projectMap = useMemo(() => {
    return new Map(projects.map((project) => [project.id, project]))
  }, [projects])

  const favorites = useMemo(() => {
    const favoriteIds = workspaceFavoriteProjectIds[activeWorkspaceId] ?? []

    return favoriteIds
      .map((projectId) => projectMap.get(projectId))
      .filter((project) => project !== undefined)
      .map((project) => ({
        id: project.id,
        name: project.name,
        url: `/projects/${project.id}`,
      }))
  }, [activeWorkspaceId, projectMap])

  const recentProjects = useMemo(() => {
    const recentIds = workspaceRecentProjectIds[activeWorkspaceId] ?? []

    return recentIds
      .map((projectId) => projectMap.get(projectId))
      .filter((project) => project !== undefined)
      .map((project) => ({
        id: project.id,
        name: project.name,
        url: `/projects/${project.id}`,
      }))
  }, [activeWorkspaceId, projectMap])

  const sidebarWorkspaces = workspaces.map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    plan: workspace.plan,
  }))

  const user = {
    name: authUser ? `${authUser.fname} ${authUser.lname}`.trim() : "HandIt User",
    email: authUser?.email ?? "user@handit.app",
    avatar: "/avatars/user.jpg",
  }

  const fallbackWorkspace = {
    id: "workspace",
    name: "Workspace",
    plan: "Free",
  }

  const workspaceForHeader = activeWorkspace ?? fallbackWorkspace

  const layoutWorkspaces =
    sidebarWorkspaces.length > 0
      ? sidebarWorkspaces
      : [
          {
            id: fallbackWorkspace.id,
            name: fallbackWorkspace.name,
            plan: fallbackWorkspace.plan,
          },
        ]

  const currentWorkspaceId = activeWorkspace?.id ?? fallbackWorkspace.id

  const handleSignOut = () => {
    void logoutSession()
      .catch(() => undefined)
      .finally(() => {
        clearSession()
        navigate("/auth/login", { replace: true })
      })
  }

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar
        user={user}
        onSignOut={handleSignOut}
        workspaces={layoutWorkspaces}
        activeWorkspaceId={currentWorkspaceId}
        onWorkspaceChange={setActiveWorkspace}
        favorites={favorites}
        recentProjects={recentProjects}
      />
      <SidebarInset>
        <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-sm">
          <div className="flex h-12 items-center gap-3 px-3 md:px-6">
            <SidebarTrigger className="-ml-1" />
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">Workspace</p>
              <h1 className="truncate text-sm font-medium">
                {workspaceForHeader.name} · {getPageTitle(location.pathname)}
              </h1>
            </div>
            <div className="ml-auto hidden text-xs text-muted-foreground md:block">
              {workspaces.length > 0 ? `${activeWorkspace?.memberCount ?? 0} members` : "No workspace selected"}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
