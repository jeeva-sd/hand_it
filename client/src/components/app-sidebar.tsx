import * as React from "react"

import { NavUser } from "@/components/nav-user"
import { Button } from "@/components/ui/button"
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
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  ChevronDownIcon,
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

export function AppSidebar({
  user,
  workspaces,
  activeWorkspaceId,
  onWorkspaceChange,
  favorites,
  recentProjects,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: SidebarUser
  workspaces: WorkspaceItem[]
  activeWorkspaceId: string
  onWorkspaceChange: (workspaceId: string) => void
  favorites: SidebarProject[]
  recentProjects: SidebarProject[]
}) {
  const location = useLocation()

  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0]

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
                      {activeWorkspace?.name.slice(0, 2).toUpperCase()}
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
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-1 px-1 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="gap-2">
            <StarIcon className="size-3.5" />
            Favorites
          </SidebarGroupLabel>
          <SidebarMenu>
            {favorites.map((project) => (
              <SidebarMenuItem key={project.id}>
                <SidebarMenuButton asChild isActive={location.pathname === project.url}>
                  <Link to={project.url}>
                    <StarIcon className="size-3.5" />
                    <span>{project.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {favorites.length === 0 && (
              <SidebarMenuItem>
                <SidebarMenuButton className="text-sidebar-foreground/60" disabled>
                  <span>No favorites yet</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="gap-2">
            <Clock3Icon className="size-3.5" />
            Recent Projects
          </SidebarGroupLabel>
          <SidebarMenu>
            {recentProjects.map((project) => (
              <SidebarMenuItem key={project.id}>
                <SidebarMenuButton asChild isActive={location.pathname === project.url}>
                  <Link to={project.url}>
                    <span>{project.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {recentProjects.length === 0 && (
              <SidebarMenuItem>
                <SidebarMenuButton className="text-sidebar-foreground/60" disabled>
                  <span>No recent projects</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem className="mt-1">
              <Button asChild variant="ghost" className="h-8 w-full justify-start rounded-md px-2 text-sm">
                <Link to="/projects">
                  <PlusIcon className="size-4" />
                  New Project
                </Link>
              </Button>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === "/projects"}>
                <Link to="/projects">
                  <FolderIcon className="size-4" />
                  <span>All Projects</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === "/settings" && location.search.includes("tab=members")}>
                <Link to="/settings?tab=members">
                  <UsersIcon className="size-4" />
                  <span>Members</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === "/settings" && location.search.includes("tab=billing")}>
                <Link to="/settings?tab=billing">
                  <CreditCardIcon className="size-4" />
                  <span>Billing</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === "/settings" && location.search.includes("tab=settings")}>
                <Link to="/settings?tab=settings">
                  <SettingsIcon className="size-4" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/70 p-3">
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
