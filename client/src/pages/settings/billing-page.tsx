import { useNavigate, useParams } from "react-router-dom"

import { appPaths } from "@/app/router/paths"
import { Button } from "@/components/ui/button"
import { useWorkspaceQuery } from "@/features/workspace/use-workspace-query"

export function BillingPage() {
  const navigate = useNavigate()
  const { workspaceId = "" } = useParams()
  const { data: workspace, isError, isPending } = useWorkspaceQuery(workspaceId)

  if (!workspaceId) {
    return (
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold">Billing</h2>
          <p className="mt-1 text-sm text-muted-foreground">Workspace route is missing. Please open a workspace URL.</p>
        </div>

        <div className="rounded-2xl border border-dashed border-border p-6">
          <Button onClick={() => navigate(appPaths.postLogin)}>Go to Workspace</Button>
        </div>
      </section>
    )
  }

  if (isPending) {
    return (
      <section className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Loading billing workspace...
      </section>
    )
  }

  if (isError || !workspace) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-sm text-red-700">
        Unable to load this workspace from URL right now. Please refresh and try again.
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Billing</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          View billing and plan details for <span className="font-medium text-foreground">{workspace.name}</span>.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Billing management UI is coming next.</p>
      </div>
    </section>
  )
}
