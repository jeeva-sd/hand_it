import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import {
  ChevronDown,
  FolderOpen,
  Plus,
  Users,
  Settings,
  Search,
  Bell,
  Palette,
  Keyboard,
  LogOut,
  User as UserIcon,
  Home,
  Inbox,
  Link2,
  ClipboardList,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/user-avatar"
import { WorkspaceAvatar } from "@/components/workspace-avatar"
import { useAuthStore } from "@/stores/auth.store"
import { cn } from "@/lib/utils"
import { ProfileSheet } from "@/components/profile-sheet"

type WorkspaceItem = {
  id: string
  name: string
  plan: string
  logoUrl?: string | null
  updatedAt?: string
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

function NavLink({
  to,
  icon: Icon,
  children,
  exact,
  badge,
  onClick,
}: {
  to: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  exact?: boolean
  badge?: number
  onClick?: () => void
}) {
  const location = useLocation()
  const path = location.pathname
  const active = exact ? path === to : path === to || path.startsWith(to + "/")

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-70" />
      <span className="flex-1 truncate">{children}</span>
      {badge ? (
        <span className="rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
          {badge}
        </span>
      ) : null}
    </Link>
  )
}

function ProjectLink({ name, url, onClick }: { name: string; url: string; onClick?: () => void }) {
  const location = useLocation()
  const active = location.pathname === url
  return (
    <Link
      to={url}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <span className="w-4 text-center text-xs">★</span>
      <span className="truncate">{name}</span>
    </Link>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
      {children}
    </div>
  )
}

export function AppSidebar({
  user,
  onSignOut,
  onCreateWorkspace,
  workspaces,
  activeWorkspaceId,
  onWorkspaceChange,
  favorites,
  onLinkClick,
}: {
  user: SidebarUser
  onSignOut: () => void
  onCreateWorkspace: () => void
  workspaces: WorkspaceItem[]
  activeWorkspaceId: string
  onWorkspaceChange: (workspaceId: string) => void
  favorites: SidebarProject[]
  onLinkClick?: () => void
}) {
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId)
  const authUser = useAuthStore((state) => state.user)

  const workspaceHomePath = activeWorkspaceId ? `/w/${activeWorkspaceId}` : "/"
  const workspaceProjectsPath = activeWorkspaceId ? `/w/${activeWorkspaceId}/projects` : "/projects"
  const workspaceMembersPath = activeWorkspaceId ? `/w/${activeWorkspaceId}/settings/members` : "/settings/members"
  const workspaceSettingsPath = activeWorkspaceId ? `/w/${activeWorkspaceId}/settings` : "/settings"

  return (
    <aside className="flex flex-col h-full w-full text-sidebar-foreground p-3 select-none">
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-sidebar-accent cursor-pointer">
              <WorkspaceAvatar
                name={activeWorkspace?.name || "Select Workspace"}
                logoUrl={activeWorkspace?.logoUrl}
                updatedAt={activeWorkspace?.updatedAt}
                className="h-6 w-6 rounded"
                fallbackClassName="text-[11px] font-semibold bg-primary text-primary-foreground"
              />
              <span className="flex-1 text-left truncate">{activeWorkspace?.name || "Select Workspace"}</span>
              <ChevronDown className="h-4 w-4 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 rounded-lg border border-border p-1.5">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => {
                  onWorkspaceChange(workspace.id)
                  onLinkClick?.()
                }}
                className="rounded-lg px-2 py-2 cursor-pointer"
              >
                <WorkspaceAvatar
                  name={workspace.name}
                  logoUrl={workspace.logoUrl}
                  updatedAt={workspace.updatedAt}
                  className="h-4 w-4 rounded mr-2"
                  fallbackClassName="text-[8px] font-semibold bg-primary text-primary-foreground"
                />
                <span className="truncate">{workspace.name}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCreateWorkspace} className="rounded-lg px-2 py-2 cursor-pointer">
              <Plus className="h-4 w-4 mr-2" /> New workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button onClick={onLinkClick} className="mt-2 flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-background/60 px-2 py-1.5 text-xs text-muted-foreground hover:bg-sidebar-accent">
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="rounded border bg-muted px-1 text-[10px] font-mono">⌘K</kbd>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mt-4 space-y-4">
        <div className="space-y-0.5">
          <NavLink to={workspaceHomePath} icon={Home} exact onClick={onLinkClick}>Home</NavLink>
          <NavLink to="#" icon={Inbox} onClick={onLinkClick}>Inbox</NavLink>
          <NavLink to={workspaceProjectsPath} icon={FolderOpen} exact onClick={onLinkClick}>All Projects</NavLink>
          <NavLink to="#" icon={Link2} onClick={onLinkClick}>Shares</NavLink>
          <NavLink to="#" icon={ClipboardList} onClick={onLinkClick}>Templates</NavLink>
        </div>

        {favorites.length > 0 && (
          <div>
            <SectionLabel>Favorites</SectionLabel>
            <div className="space-y-0.5">
              {favorites.map((p) => (
                <ProjectLink key={p.id} name={p.name} url={p.url} onClick={onLinkClick} />
              ))}
            </div>
          </div>
        )}

        <div>
          <SectionLabel>Workspace</SectionLabel>
          <div className="space-y-0.5">
            <NavLink to={workspaceMembersPath} icon={Users} exact onClick={onLinkClick}>Members</NavLink>
            <NavLink to={workspaceSettingsPath} icon={Settings} exact onClick={onLinkClick}>Settings</NavLink>
          </div>
        </div>
      </div>

      <div className="border-t pt-2 mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-sidebar-accent">
              <UserAvatar
                userId={authUser?.id}
                fname={authUser?.fname || "HandIt"}
                lname={authUser?.lname || "User"}
                className="h-7 w-7"
                fallbackClassName="bg-primary/10 text-primary text-xs"
              />
              <span className="flex-1 text-left font-medium truncate">{user.name}</span>
              <ChevronDown className="h-4 w-4 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-60 p-1.5 rounded-lg border border-border">
            <div className="px-2 py-2">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg" onClick={() => {
              setIsProfileOpen(true)
              onLinkClick?.()
            }}><UserIcon className="mr-2 h-4 w-4 opacity-70" /> Profile</DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg" onClick={onLinkClick}><Bell className="mr-2 h-4 w-4 opacity-70" /> Notifications</DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg" onClick={onLinkClick}><Palette className="mr-2 h-4 w-4 opacity-70" /> Theme</DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg" onClick={onLinkClick}><Keyboard className="mr-2 h-4 w-4 opacity-70" /> Keyboard Shortcuts</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg text-destructive focus:text-destructive" onClick={onSignOut}>
              <LogOut className="mr-2 h-4 w-4 opacity-70" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProfileSheet open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </aside>
  )
}
