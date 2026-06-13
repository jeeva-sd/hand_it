import * as React from "react"
import { MoreHorizontal, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type AppRole, roleMapToFrontend, statusMapToFrontend } from "../types"
import { cn } from "@/lib/utils"
import type { WorkspaceMember } from "@/types/workspace"
import { UserAvatar } from "@/components/user-avatar"

interface MemberRowProps {
  member: WorkspaceMember
  isCurrentUser: boolean
  isFreePlan: boolean
  onRoleChange: (memberId: string, role: AppRole) => void
  onRemove: (memberId: string, name: string) => void
}

export const MemberRow = React.memo(({
  member,
  isCurrentUser,
  isFreePlan,
  onRoleChange,
  onRemove,
}: MemberRowProps) => {
  const appRole = roleMapToFrontend[member.role] || "Member"
  const appStatus = statusMapToFrontend[member.status] || "Active"

  const formattedJoinedAt = member.joinedAt
    ? new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(member.joinedAt))
    : "Just now"

  return (
    <tr className="border-b last:border-0 hover:bg-accent/40">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <UserAvatar
            userId={member.user.id}
            fname={member.user.fname}
            lname={member.user.lname}
            className="h-8 w-8"
          />
          <div>
            <div className="text-sm font-medium">
              {member.user.fname} {member.user.lname}
              {isCurrentUser && <span className="ml-2 text-xs text-muted-foreground">(You)</span>}
            </div>
            <div className="text-xs text-muted-foreground">{member.user.email}</div>
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
            appStatus === "Active" && "text-success",
            appStatus === "Declined" && "text-destructive",
            appStatus !== "Active" && appStatus !== "Declined" && "text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              appStatus === "Active" && "bg-success",
              appStatus === "Declined" && "bg-destructive",
              appStatus !== "Active" && appStatus !== "Declined" && "bg-muted-foreground",
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
                <DropdownMenuItem key={r} onClick={() => onRoleChange(member.id, r)}>
                  {r}
                  {appRole === r && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onRemove(member.id, `${member.user.fname} ${member.user.lname}`)}
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

MemberRow.displayName = "MemberRow"
