import React, { useState } from "react"
import { useInviteMemberMutation } from "../queries"
import { toast } from "@/stores/toast.store"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type InviteFormProps = {
  workspaceId: string
}

export function InviteForm({ workspaceId }: InviteFormProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("MEMBER")

  const inviteMutation = useInviteMemberMutation(
    workspaceId,
    () => {
      toast.success(`Successfully invited ${email}`)
      setEmail("")
    },
    (err: any) => {
      toast.error(err?.message || "Failed to send invitation. Please try again.")
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    inviteMutation.mutate({
      email: email.trim(),
      role,
    })
  }

  return (
    <div className="bg-card border rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold mb-2">Invite new member</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Invited users will receive an email invitation to join your workspace.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label htmlFor="email" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-10 bg-background border border-input rounded-md px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm"
            />
          </div>

          <div className="w-full md:w-48">
            <label htmlFor="role" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Role
            </label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role" className="w-full !h-10 bg-background border border-input rounded-md px-4 text-foreground text-sm cursor-pointer flex justify-between items-center">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <button
            type="submit"
            disabled={inviteMutation.isPending}
            className="w-full md:w-auto h-10 px-6 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-medium rounded-md text-sm transition-colors cursor-pointer"
          >
            {inviteMutation.isPending ? "Sending..." : "Send Invite"}
          </button>
        </div>
      </form>
    </div>
  )
}
