import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { appPaths, resolveWorkspaceSwitchPath } from "@/app/router/paths"
import { useProjectsQuery } from "@/features/project/use-projects-query"
import { logoutSession } from "@/services/auth.service"
import { useAuthStore } from "@/stores/auth.store"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { useMemo } from "react"
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom"

function getPageTitle(pathname: string) {
  const routePath = pathname.replace(/^\/w\/[^/]+/, "")

  if (routePath.startsWith("/projects/")) {
    return "Project"
  }

  if (routePath.startsWith("/projects")) {
    return "All Projects"
  }

  if (routePath.startsWith("/settings")) {
    return "Workspace"
  }

  return "Dashboard"
}

export function AppShellLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { workspaceId = "" } = useParams()

  const authUser = useAuthStore((state) => state.user)
  const lastUsedWorkspace = useAuthStore((state) => state.lastUsedWorkspace)
  const setLastUsedWorkspace = useAuthStore((state) => state.setLastUsedWorkspace)
  const clearSession = useAuthStore((state) => state.clearSession)

  const workspaces = useWorkspaceStore((state) => state.workspaces)
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId)
  const setActiveWorkspace = useWorkspaceStore((state) => state.setActiveWorkspace)

  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === workspaceId) ??
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ??
    workspaces[0]

  const currentWorkspaceId = workspaceId || activeWorkspace?.id || lastUsedWorkspace?.id || ""

  const { data: projects = [] } = useProjectsQuery(currentWorkspaceId)

  const favorites = useMemo(() => {
    if (!currentWorkspaceId) {
      return []
    }

    return projects
      .filter((project) => project.isFavorite)
      .map((project) => ({
        id: project.id,
        name: project.name,
        url: appPaths.workspaceProjectSection(currentWorkspaceId, project.id, "files"),
      }))
  }, [currentWorkspaceId, projects])

  const recentProjects = useMemo(() => {
    if (!currentWorkspaceId) {
      return []
    }

    const parseUpdatedAt = (value: string) => {
      const parsed = Date.parse(value)

      return Number.isNaN(parsed) ? 0 : parsed
    }

    return [...projects]
      .sort((left, right) => parseUpdatedAt(right.updatedAt) - parseUpdatedAt(left.updatedAt))
      .slice(0, 5)
      .map((project) => ({
        id: project.id,
        name: project.name,
        url: appPaths.workspaceProjectSection(currentWorkspaceId, project.id, "files"),
      }))
  }, [currentWorkspaceId, projects])

  const sidebarWorkspaces =
    workspaces.length > 0
      ? workspaces.map((workspace) => ({
          id: workspace.id,
          name: workspace.name,
          plan: workspace.plan,
        }))
      : lastUsedWorkspace
        ? [
            {
              id: lastUsedWorkspace.id,
              name: lastUsedWorkspace.name,
              plan: lastUsedWorkspace.plan,
            },
          ]
        : []

  const user = {
    name: authUser ? `${authUser.fname} ${authUser.lname}`.trim() : "HandIt User",
    email: authUser?.email ?? "user@handit.app",
    avatar: "/avatars/user.jpg",
  }

  const workspaceForHeaderName = activeWorkspace?.name ?? lastUsedWorkspace?.name ?? "Workspace"

  const handleSignOut = () => {
    void logoutSession()
      .catch(() => undefined)
      .finally(() => {
        clearSession()
        navigate(appPaths.authLogin, { replace: true })
      })
  }

  const handleCreateWorkspace = () => {
    navigate(appPaths.createWorkspace)
  }

  const handleWorkspaceChange = (workspaceId: string) => {
    if (workspaceId === currentWorkspaceId) {
      return
    }

    setActiveWorkspace(workspaceId)

    const selectedWorkspace = workspaces.find((workspace) => workspace.id === workspaceId)

    if (!selectedWorkspace) {
      return
    }

    setLastUsedWorkspace({
      id: selectedWorkspace.id,
      name: selectedWorkspace.name,
      plan: selectedWorkspace.plan,
      roleId: lastUsedWorkspace?.roleId ?? null,
      accessId: lastUsedWorkspace?.accessId ?? null,
    })

    const nextPath = resolveWorkspaceSwitchPath(location.pathname, workspaceId)
    navigate(`${nextPath}${location.search}${location.hash}`, { replace: true })
  }

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar
        user={user}
        onSignOut={handleSignOut}
        onCreateWorkspace={handleCreateWorkspace}
        workspaces={sidebarWorkspaces}
        activeWorkspaceId={currentWorkspaceId}
        onWorkspaceChange={handleWorkspaceChange}
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
                {workspaceForHeaderName} · {getPageTitle(location.pathname)}
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
