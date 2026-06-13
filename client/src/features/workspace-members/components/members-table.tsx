import { MemberRow } from "./table-row"
import type { AppRole } from "../types"
import type { WorkspaceMember } from "@/types/workspace"

interface MembersTableProps {
  members: WorkspaceMember[]
  currentUserId: string
  isFreePlan: boolean
  isLoading: boolean
  onRoleChange: (memberId: string, role: AppRole) => void
  onRemove: (memberId: string, name: string) => void
}

export function MembersTable({
  members,
  currentUserId,
  isFreePlan,
  isLoading,
  onRoleChange,
  onRemove,
}: MembersTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full min-w-[600px]">
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
          {isLoading ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span>Loading members...</span>
                </div>
              </td>
            </tr>
          ) : members.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                No members found.
              </td>
            </tr>
          ) : (
            members.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                isCurrentUser={currentUserId === m.user.id}
                isFreePlan={isFreePlan}
                onRoleChange={onRoleChange}
                onRemove={onRemove}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
