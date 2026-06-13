import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useQueryClient, useMutation } from "@tanstack/react-query"
import { MoreHorizontal, Mail, Check, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useWorkspaceMembersInfiniteQuery } from "@/features/workspace/use-workspace-members-query"
import { useAuthStore } from "@/stores/auth.store"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { cn } from "@/lib/utils"
import { resolveApiError } from "@/services/http.service"
import {
  inviteWorkspaceMember,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from "@/services/workspace.service"

type AppRole = "Owner" | "Admin" | "Member"

const roleHint: Record<AppRole, string> = {
  Owner: "Full access · billing · workspace settings",
  Admin: "Manage members, projects, files, shares, requests",
  Member: "Access assigned projects",
}

const roleMapToBackend: Record<AppRole, "OWNER" | "ADMIN" | "MEMBER"> = {
  Owner: "OWNER",
  Admin: "ADMIN",
  Member: "MEMBER",
}

const roleMapToFrontend: Record<string, AppRole> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Member",
}

const statusMapToFrontend: Record<string, string> = {
  ACTIVE: "Active",
  INVITED: "Invited",
  DECLINED: "Declined",
  DELETED: "Deleted",
}

export function MembersPage() {
  const { workspaceId = "" } = useParams()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.user)

  // Resolve plan and workspace info from store, removing direct workspace API call
  const workspaces = useWorkspaceStore((state) => state.workspaces)
  const activeWorkspace = workspaces.find((w) => w.id === workspaceId)
  const isFreePlan = activeWorkspace?.plan?.toUpperCase() === "FREE"
  const workspaceName = activeWorkspace?.name || "the workspace"

  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Call only members list API in infinite scroll
  const {
    data,
    isPending,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useWorkspaceMembersInfiniteQuery(workspaceId, debouncedSearch)

  const members = data?.pages.flatMap((page) => page.members) ?? []

  const [email, setEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<AppRole>("Member")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Setup infinite scroll observer
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchNextPage()
        }
      },
      { threshold: 0.5 }
    )

    const target = document.getElementById("infinite-scroll-trigger")
    if (target) {
      observer.observe(target)
    }

    return () => {
      if (target) {
        observer.unobserve(target)
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const inviteMutation = useMutation({
    mutationFn: (payload: { email: string; role: string }) =>
      inviteWorkspaceMember(workspaceId, payload),
    onSuccess: () => {
      setEmail("")
      setSuccessMessage("Invitation sent successfully.")
      setErrorMessage(null)
      void queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId, "members"] })
    },
    onError: (error: any) => {
      setSuccessMessage(null)
      setErrorMessage(resolveApiError(error, "Failed to send invitation. Please try again."))
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: (payload: { memberId: string; role: string }) =>
      updateWorkspaceMemberRole(workspaceId, payload.memberId, payload.role),
    onSuccess: () => {
      setSuccessMessage("Member role updated successfully.")
      setErrorMessage(null)
      void queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId, "members"] })
    },
    onError: (error: any) => {
      setSuccessMessage(null)
      setErrorMessage(resolveApiError(error, "Failed to update member role."))
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => removeWorkspaceMember(workspaceId, memberId),
    onSuccess: () => {
      setSuccessMessage("Member removed successfully.")
      setErrorMessage(null)
      void queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId, "members"] })
    },
    onError: (error: any) => {
      setSuccessMessage(null)
      setErrorMessage(resolveApiError(error, "Failed to remove member."))
    },
  })

  const invite = () => {
    if (isFreePlan) return
    const value = email.trim()
    if (!value) return
    setErrorMessage(null)
    setSuccessMessage(null)
    inviteMutation.mutate({ email: value, role: roleMapToBackend[inviteRole] })
  }

  const changeRole = (memberId: string, role: AppRole) => {
    if (isFreePlan) return
    setErrorMessage(null)
    setSuccessMessage(null)
    updateRoleMutation.mutate({ memberId, role: roleMapToBackend[role] })
  }

  const remove = (memberId: string, name: string) => {
    if (isFreePlan) return
    const confirmed = window.confirm(`Remove ${name} from this workspace?`)
    if (!confirmed) return
    setErrorMessage(null)
    setSuccessMessage(null)
    removeMemberMutation.mutate(memberId)
  }

  if (!workspaceId) {
    return (
      <div className="mx-auto max-w-5xl px-8 py-10">
        <h1 className="text-2xl font-semibold">Members</h1>
        <p className="mt-1 text-sm text-muted-foreground">Workspace ID is missing.</p>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="mx-auto max-w-5xl px-8 py-10 text-center text-sm text-muted-foreground">
        Loading members...
      </div>
    )
  }

  if (isError) {
    const errorMsg = resolveApiError(
      error,
      "Unable to load members. Please refresh and try again."
    )
    return (
      <div className="mx-auto max-w-5xl px-8 py-10 text-center text-sm text-red-700 bg-red-50/50 border border-red-200 rounded-xl">
        {errorMsg}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Three roles. Nothing complicated.
          </p>
        </div>
      </header>

      {isFreePlan && (
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Members can be viewed, but inviting or modifying workspace access requires a Pro plan.
        </div>
      )}

      {successMessage && <p className="mb-6 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">{successMessage}</p>}
      {errorMessage && <p className="mb-6 rounded-lg bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive">{errorMessage}</p>}

      <section className="mb-8 rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold">Invite a teammate</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          They'll get an email to join {workspaceName} and can start uploading right away.
        </p>
        <div className="mt-4 flex gap-2">
          <Input
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                invite()
              }
            }}
            className="flex-1"
            disabled={isFreePlan || inviteMutation.isPending}
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as AppRole)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
            disabled={isFreePlan || inviteMutation.isPending}
          >
            <option value="Member">Member</option>
            <option value="Admin">Admin</option>
          </select>
          <Button onClick={invite} disabled={isFreePlan || inviteMutation.isPending}>
            <Mail className="h-4 w-4 mr-2" /> Send invite
          </Button>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(["Owner", "Admin", "Member"] as AppRole[]).map((r) => (
          <div key={r} className="rounded-xl border bg-card p-4">
            <div className="text-sm font-semibold">{r}</div>
            <div className="mt-1 text-xs text-muted-foreground">{roleHint[r]}</div>
          </div>
        ))}
      </section>

      {/* Elegant Search Input */}
      <div className="mb-4 flex max-w-xs items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-within:outline-none focus-within:ring-1 focus-within:ring-primary">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none placeholder:text-muted-foreground text-sm"
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full">
          <thead className="border-b bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Member</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Joined</th>
              <th className="px-2" />
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No members found.
                </td>
              </tr>
            ) : (
              members.map((m) => {
                const appRole = roleMapToFrontend[m.role] || "Member"
                const appStatus = statusMapToFrontend[m.status] || "Active"
                const isCurrentUser = currentUser?.id === m.userId
                const initials = `${m.user.fname.slice(0, 1)}${m.user.lname.slice(0, 1)}`.toUpperCase() || "US"

                const formattedJoinedAt = m.joinedAt
                  ? new Intl.DateTimeFormat(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }).format(new Date(m.joinedAt))
                  : "Just now"

                return (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-accent/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-secondary text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">
                            {m.user.fname} {m.user.lname}
                            {isCurrentUser && <span className="ml-2 text-xs text-muted-foreground">(You)</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">{m.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-normal",
                          appRole === "Owner" && "bg-primary/10 text-primary",
                        )}
                      >
                        {appRole}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-xs",
                          appStatus === "Active" ? "text-success" : "text-muted-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            appStatus === "Active" ? "bg-success" : "bg-muted-foreground",
                          )}
                        />
                        {appStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formattedJoinedAt}</td>
                    <td className="px-2 text-right">
                      {!isCurrentUser && appRole !== "Owner" && !isFreePlan ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel className="text-xs">Change role</DropdownMenuLabel>
                            {(["Admin", "Member"] as AppRole[]).map((r) => (
                              <DropdownMenuItem key={r} onClick={() => changeRole(m.id, r)}>
                                {r}
                                {appRole === r && <Check className="ml-auto h-4 w-4" />}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => remove(m.id, `${m.user.fname} ${m.user.lname}`)}
                            >
                              Remove from workspace
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="pr-2 text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Infinite scroll trigger element */}
      <div id="infinite-scroll-trigger" className="h-4 w-full" />

      {isFetchingNextPage && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Loading more members...
        </div>
      )}

      {!isFetchingNextPage && hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={() => void fetchNextPage()}
            className="text-xs"
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
