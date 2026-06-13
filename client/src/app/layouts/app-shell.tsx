import { useState, useMemo } from "react"
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom"
import { Menu, X } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { useProjectsQuery } from "@/features/project/use-projects-query"
import { useWorkspaceQuery } from "@/features/workspace/use-workspace-query"
import { logoutSession } from "@/services/auth.service"
import { selectWorkspace } from "@/services/workspace.service"
import { useAuthStore } from "@/stores/auth.store"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { cn } from "@/lib/utils"

export function AppShellLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { workspaceId = "" } = useParams()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const authUser = useAuthStore((state) => state.user)
  const lastUsedWorkspace = useAuthStore((state) => state.lastUsedWorkspace)
  const setLastUsedWorkspace = useAuthStore((state) => state.setLastUsedWorkspace)
  const clearSession = useAuthStore((state) => state.clearSession)

  const workspaces = useWorkspaceStore((state) => state.workspaces)
  const setActiveWorkspace = useWorkspaceStore((state) => state.setActiveWorkspace)

  const currentWorkspaceId = workspaceId
  const workspaceQuery = useWorkspaceQuery(currentWorkspaceId)
  const activeWorkspace = workspaceQuery.data ?? workspaces.find((workspace) => workspace.id === workspaceId)

  const { data: paginatedData } = useProjectsQuery(currentWorkspaceId, {
    enabled: workspaceQuery.isSuccess && !!currentWorkspaceId,
    page: 1,
    size: 20,
  })
  const projects = paginatedData?.projects ?? []

  const favorites = useMemo(() => {
    if (!currentWorkspaceId) {
      return []
    }

    return projects
      .filter((project) => project.isFavorite)
      .map((project) => ({
        id: project.id,
        name: project.name,
        url: `/w/${currentWorkspaceId}/projects/${project.id}/files`,
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
    avatar: authUser?.avatarUrl ?? "/avatars/user.jpg",
  }

  const handleSignOut = () => {
    void logoutSession()
      .catch(() => undefined)
      .finally(() => {
        clearSession()
        navigate("/auth/login", { replace: true })
      })
  }

  const handleCreateWorkspace = () => {
    navigate("/workspace/create")
    setIsSidebarOpen(false)
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

    const relativePath = location.pathname.replace(/^\/w\/[^/]+/, "")
    const nextPath = relativePath.startsWith("/projects/") || relativePath.length <= 1
      ? `/w/${nextWorkspaceId}/projects`
      : `/w/${nextWorkspaceId}${relativePath}`

    navigate(`${nextPath}${location.search}${location.hash}`, { replace: true })
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container Wrapper */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col border-r bg-sidebar transition-transform duration-200 ease-in-out md:static md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile Close Button */}
        <div className="flex justify-end p-2 md:hidden">
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-md p-1.5 hover:bg-sidebar-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <AppSidebar
          user={user}
          onSignOut={handleSignOut}
          onCreateWorkspace={handleCreateWorkspace}
          workspaces={sidebarWorkspaces}
          activeWorkspaceId={currentWorkspaceId}
          onWorkspaceChange={(id) => {
            handleWorkspaceChange(id)
            setIsSidebarOpen(false)
          }}
          favorites={favorites}
          onLinkClick={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile Navigation Header */}
        <header className="flex h-14 items-center justify-between border-b px-4 md:hidden bg-card">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-md p-1.5 hover:bg-accent hover:text-accent-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold truncate px-2">{activeWorkspace?.name || "handit"}</span>
          <div className="w-8" />
        </header>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
