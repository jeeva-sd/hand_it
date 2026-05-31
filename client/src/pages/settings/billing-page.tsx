import { useMemo } from "react"
import { useNavigate } from "react-router-dom"

import { appPaths } from "@/app/router/paths"
import { Button } from "@/components/ui/button"
import { useWorkspaceStore } from "@/stores/workspace.store"

export function BillingPage() {
  const navigate = useNavigate()

  const workspaces = useWorkspaceStore((state) => state.workspaces)
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId)

  const activeWorkspace = useMemo(() => {
    if (activeWorkspaceId) {
      return workspaces.find((workspace) => workspace.id === activeWorkspaceId)
    }

    return workspaces[0]
  }, [activeWorkspaceId, workspaces])

  if (!activeWorkspace) {
    return (
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold">Billing</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create a workspace before managing billing.</p>
        </div>

        <div className="rounded-2xl border border-dashed border-border p-6">
          <Button onClick={() => navigate(appPaths.createWorkspace)}>Create Workspace</Button>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Billing</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          View billing and plan details for <span className="font-medium text-foreground">{activeWorkspace.name}</span>.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Billing management UI is coming next.</p>
      </div>
    </section>
  )
}
