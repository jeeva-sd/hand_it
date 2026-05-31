import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { appPaths, resolveWorkspaceSwitchPath } from "@/app/router/paths"
import { useProjectsQuery } from "@/features/project/use-projects-query"
import { useProjectQuery } from "@/features/project/use-project-query"
import { useWorkspaceQuery } from "@/features/workspace/use-workspace-query"
import { logoutSession } from "@/services/auth.service"
import { selectWorkspace } from "@/services/workspace.service"
import { useAuthStore } from "@/stores/auth.store"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { useMemo, Fragment } from "react"
import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router-dom"

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
  const setActiveWorkspace = useWorkspaceStore((state) => state.setActiveWorkspace)

  const currentWorkspaceId = workspaceId
  const workspaceQuery = useWorkspaceQuery(currentWorkspaceId)
  const activeWorkspace = workspaceQuery.data ?? workspaces.find((workspace) => workspace.id === workspaceId)
  const workspaceForHeaderName = activeWorkspace?.name ?? lastUsedWorkspace?.name ?? "Workspace"

  const { data: paginatedData } = useProjectsQuery(currentWorkspaceId, {
    enabled: workspaceQuery.isSuccess && !!currentWorkspaceId,
    page: 1,
    size: 20,
  })
  const projects = paginatedData?.projects ?? []

  const { projectId = "" } = useParams()
  const projectQuery = useProjectQuery(currentWorkspaceId, projectId, !!projectId && workspaceQuery.isSuccess)
  const projectName = projectQuery.data?.name ?? projects.find((p) => p.id === projectId)?.name ?? "Project"

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

  const breadcrumbs = useMemo(() => {
    const list: Array<{ label: string; url?: string; isCurrent: boolean }> = []

    // 1. Workspace Level
    list.push({
      label: workspaceForHeaderName,
      url: appPaths.workspaceProjects(currentWorkspaceId),
      isCurrent: false,
    })

    const pathname = location.pathname
    const relativePath = pathname.replace(/^\/w\/[^/]+/, "")

    if (relativePath.startsWith("/settings")) {
      list.push({
        label: "Settings",
        url: relativePath === "/settings" ? undefined : appPaths.workspaceSettings(currentWorkspaceId),
        isCurrent: relativePath === "/settings",
      })

      if (relativePath === "/settings/members") {
        list.push({
          label: "Members",
          isCurrent: true,
        })
      } else if (relativePath === "/settings/billing") {
        list.push({
          label: "Billing",
          isCurrent: true,
        })
      }
    } else if (relativePath.startsWith("/projects")) {
      list.push({
        label: "Projects",
        url: projectId ? appPaths.workspaceProjects(currentWorkspaceId) : undefined,
        isCurrent: !projectId,
      })

      if (projectId) {
        // Find if files, shares or activity is current
        let sectionLabel = "Files"
        if (relativePath.endsWith("/shares")) sectionLabel = "Shares"
        if (relativePath.endsWith("/activity")) sectionLabel = "Activity"

        list.push({
          label: projectName,
          url: appPaths.workspaceProjectSection(currentWorkspaceId, projectId, "files"),
          isCurrent: false,
        })

        list.push({
          label: sectionLabel,
          isCurrent: true,
        })
      }
    }

    return list
  }, [workspaceForHeaderName, currentWorkspaceId, location.pathname, projectId, projectName])

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

  const handleWorkspaceChange = (nextWorkspaceId: string) => {
    if (nextWorkspaceId === currentWorkspaceId) {
      return
    }

    setActiveWorkspace(nextWorkspaceId)

    const selectedWorkspace = workspaces.find((workspace) => workspace.id === nextWorkspaceId)

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

    void selectWorkspace(nextWorkspaceId).catch(() => undefined)

    const nextPath = resolveWorkspaceSwitchPath(location.pathname, nextWorkspaceId)
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
            <div className="min-w-0 flex-1 md:flex-none">
              {/* Desktop Dynamic Breadcrumbs */}
              <Breadcrumb className="hidden md:block">
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, idx) => (
                    <Fragment key={crumb.label + idx}>
                      {idx > 0 && <BreadcrumbSeparator />}
                      <BreadcrumbItem>
                        {crumb.isCurrent || !crumb.url ? (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link to={crumb.url}>{crumb.label}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>

              {/* Mobile Simpler Title */}
              <h1 className="md:hidden truncate text-sm font-medium">
                {getPageTitle(location.pathname)}
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
