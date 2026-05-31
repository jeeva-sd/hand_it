import { useNavigate, useParams } from "react-router-dom"

import { appPaths } from "@/app/router/paths"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useWorkspaceQuery } from "@/features/workspace/use-workspace-query"
import { useWorkspaceMembersQuery } from "@/features/workspace/use-workspace-members-query"
import type { WorkspaceMemberRole } from "@/types/workspace"
import { useAuthStore } from "@/stores/auth.store"

function getRoleLabel(role: WorkspaceMemberRole): string {
  return role.charAt(0) + role.slice(1).toLowerCase()
}

function getRoleVariant(role: WorkspaceMemberRole): "default" | "secondary" | "outline" {
  if (role === "OWNER") {
    return "default"
  }

  if (role === "ADMIN") {
    return "secondary"
  }

  return "outline"
}

function formatJoinedDate(value: string): string {
  const timestamp = Date.parse(value)

  if (Number.isNaN(timestamp)) {
    return "Unknown"
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp))
}

export function MembersPage() {
  const navigate = useNavigate()
  const { workspaceId = "" } = useParams()
  const currentUser = useAuthStore((state) => state.user)

  const { data: workspace, isError: isWorkspaceError, isPending: isWorkspacePending } = useWorkspaceQuery(workspaceId)
  const { data: members = [], isPending, isError } = useWorkspaceMembersQuery(workspaceId)

  if (!workspaceId) {
    return (
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold">Members</h2>
          <p className="mt-1 text-sm text-muted-foreground">Workspace route is missing. Please open a workspace URL.</p>
        </div>

        <div className="rounded-2xl border border-dashed border-border p-6">
          <Button onClick={() => navigate(appPaths.postLogin)}>Go to Workspace</Button>
        </div>
      </section>
    )
  }

  if (isWorkspacePending) {
    return (
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold">Members</h2>
          <p className="mt-1 text-sm text-muted-foreground">Loading workspace members...</p>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </section>
    )
  }

  if (isWorkspaceError || !workspace) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        Unable to load this workspace from URL right now. Please refresh and try again.
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Members</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage workspace access for <span className="font-medium text-foreground">{workspace.name}</span>.
          </p>
        </div>

        <Button type="button" variant="outline" disabled>
          Invite Member (soon)
        </Button>
      </div>

      {isPending && (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Unable to load workspace members right now. Please refresh and try again.
        </div>
      )}

      {!isPending && !isError && (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{members.length} member(s)</p>
          </div>

          {members.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
              No members found for this workspace.
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => {
                const isCurrentUser = currentUser?.id === member.userId

                return (
                  <div
                    key={member.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {member.user.fname} {member.user.lname}
                        {isCurrentUser ? <span className="ml-2 text-xs text-muted-foreground">(You)</span> : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">Joined {formatJoinedDate(member.joinedAt)}</p>
                      <Badge variant={getRoleVariant(member.role)}>{getRoleLabel(member.role)}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
