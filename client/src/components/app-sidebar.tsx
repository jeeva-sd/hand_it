import * as React from "react"

import { appPaths } from "@/app/router/paths"
import { NavUser } from "@/components/nav-user"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  Clock3Icon,
  CreditCardIcon,
  FolderIcon,
  PlusIcon,
  SettingsIcon,
  StarIcon,
  UsersIcon,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"

type WorkspaceItem = {
  id: string
  name: string
  plan: string
}

type SidebarProject = {
  id: string
  name: string
  url: string
}

type SidebarUser = {
  name: string
  email: string
  avatar: string
}

function isProjectLinkActive(pathname: string, projectPath: string): boolean {
  const projectBasePath = projectPath.replace(/\/files$/, "")

  return pathname === projectBasePath || pathname.startsWith(`${projectBasePath}/`)
}

export function AppSidebar({
  user,
  onSignOut,
  onCreateWorkspace,
  workspaces,
  activeWorkspaceId,
  onWorkspaceChange,
  favorites,
  recentProjects,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: SidebarUser
  onSignOut: () => void
  onCreateWorkspace: () => void
  workspaces: WorkspaceItem[]
  activeWorkspaceId: string
  onWorkspaceChange: (workspaceId: string) => void
  favorites: SidebarProject[]
  recentProjects: SidebarProject[]
}) {
  const location = useLocation()

  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId)
  const workspaceScopeId = activeWorkspace?.id || activeWorkspaceId || ""

  const workspaceProjectsPath = workspaceScopeId ? appPaths.workspaceProjects(workspaceScopeId) : "/projects"
  const workspaceMembersPath = workspaceScopeId ? appPaths.workspaceMembers(workspaceScopeId) : "/settings/members"
  const workspaceBillingPath = workspaceScopeId ? appPaths.workspaceBilling(workspaceScopeId) : "/settings/billing"
  const workspaceSettingsPath = workspaceScopeId ? appPaths.workspaceSettings(workspaceScopeId) : "/settings"

  const workspaceInitials = activeWorkspace?.name ? activeWorkspace.name.slice(0, 2).toUpperCase() : "--"
  const isWorkspaceSettingsActive = /^\/w\/[^/]+\/settings(\/|$)/.test(location.pathname)
  const isWorkspaceProjectsActive =
    location.pathname === workspaceProjectsPath || location.pathname.startsWith(`${workspaceProjectsPath}/`)
  const hasActiveFavorite = favorites.some((project) => isProjectLinkActive(location.pathname, project.url))
  const hasActiveRecentProject = recentProjects.some((project) =>
    isProjectLinkActive(location.pathname, project.url)
  )

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/70 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="h-10 rounded-xl bg-sidebar-accent/60 data-open:bg-sidebar-accent"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-[0.68rem] font-semibold text-sidebar-primary-foreground">
                      {workspaceInitials}
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="truncate text-sm font-medium">{activeWorkspace?.name}</p>
                    </div>
                  </div>
                  <ChevronDownIcon className="size-4 text-sidebar-foreground/70" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-56 rounded-xl border border-border p-1.5" align="start">
                <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {workspaces.map((workspace) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => onWorkspaceChange(workspace.id)}
                    className="rounded-lg px-2 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{workspace.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{workspace.plan} workspace</p>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onCreateWorkspace} className="rounded-lg px-2 py-2">
                  <PlusIcon className="size-4" />
                  <span>Create workspace</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-1 px-1 py-2">
        <SidebarGroup>
          <SidebarMenu>
            <Collapsible defaultOpen className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton isActive={hasActiveFavorite}>
                    <StarIcon className="size-4" />
                    <span>Favorites</span>
                    <ChevronRightIcon className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {favorites.map((project) => (
                      <SidebarMenuSubItem key={project.id}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isProjectLinkActive(location.pathname, project.url)}
                        >
                          <Link to={project.url}>
                            <span>{project.name}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                    {favorites.length === 0 && (
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton aria-disabled="true" className="text-sidebar-foreground/60">
                          <span>No favorites yet</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <Collapsible defaultOpen className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton isActive={hasActiveRecentProject || isWorkspaceProjectsActive}>
                    <Clock3Icon className="size-4" />
                    <span>Recent Projects</span>
                    <ChevronRightIcon className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {recentProjects.map((project) => (
                      <SidebarMenuSubItem key={project.id}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isProjectLinkActive(location.pathname, project.url)}
                        >
                          <Link to={project.url}>
                            <span>{project.name}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                    {recentProjects.length === 0 && (
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton aria-disabled="true" className="text-sidebar-foreground/60">
                          <span>No recent projects</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )}
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild isActive={location.pathname === workspaceProjectsPath}>
                        <Link to={workspaceProjectsPath}>
                          <FolderIcon className="size-4" />
                          <span>All Projects</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <Collapsible defaultOpen className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton isActive={isWorkspaceSettingsActive}>
                    <SettingsIcon className="size-4" />
                    <span>Settings</span>
                    <ChevronRightIcon className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild isActive={location.pathname === workspaceSettingsPath}>
                        <Link to={workspaceSettingsPath}>
                          <SettingsIcon className="size-4" />
                          <span>General</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild isActive={location.pathname === workspaceMembersPath}>
                        <Link to={workspaceMembersPath}>
                          <UsersIcon className="size-4" />
                          <span>Members</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild isActive={location.pathname === workspaceBillingPath}>
                        <Link to={workspaceBillingPath}>
                          <CreditCardIcon className="size-4" />
                          <span>Billing</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/70 p-3">
        <NavUser user={user} onSignOut={onSignOut} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
