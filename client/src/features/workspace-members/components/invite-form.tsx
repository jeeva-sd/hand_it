import { useState } from "react"
import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useInviteMemberMutation } from "../queries"
import { type AppRole, roleMapToBackend } from "../types"
import { resolveApiError } from "@/services/http.service"

interface InviteMemberFormProps {
  workspaceId: string
  workspaceName: string
  isFreePlan: boolean
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export function InviteMemberForm({
  workspaceId,
  workspaceName,
  isFreePlan,
  onSuccess,
  onError,
}: InviteMemberFormProps) {
  const [email, setEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<AppRole>("Member")

  const inviteMutation = useInviteMemberMutation(
    workspaceId,
    () => {
      setEmail("")
      onSuccess("Invitation sent successfully.")
    },
    (err) => {
      onError(resolveApiError(err, "Failed to send invitation. Please try again."))
    }
  )

  const handleInvite = () => {
    if (isFreePlan) return

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      onError("Please enter an email address.")
      return
    }

    // Client-side email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      onError("Please enter a valid email address.")
      return
    }

    inviteMutation.mutate({
      email: trimmedEmail,
      role: roleMapToBackend[inviteRole],
    })
  }

  return (
    <section className="mb-8 rounded-xl border bg-card p-5">
      <h2 className="text-sm font-semibold">Invite a teammate</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        They'll get an email to join {workspaceName} and can start uploading right away.
      </p>
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <Input
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleInvite()
            }
          }}
          className="flex-1 text-sm h-9"
          disabled={isFreePlan || inviteMutation.isPending}
        />
        <select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value as AppRole)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none sm:w-32"
          disabled={isFreePlan || inviteMutation.isPending}
        >
          <option value="Member">Member</option>
          <option value="Admin">Admin</option>
        </select>
        <Button
          onClick={handleInvite}
          disabled={isFreePlan || inviteMutation.isPending}
          size="sm"
          className="h-9 shrink-0"
        >
          {inviteMutation.isPending ? (
            "Sending..."
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" /> Send invite
            </>
          )}
        </Button>
      </div>
    </section>
  )
}
