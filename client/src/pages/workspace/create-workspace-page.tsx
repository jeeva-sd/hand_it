import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { appConfig } from "@/config"
import { ApiError } from "@/services/http.service"
import { createWorkspace } from "@/services/workspace.service"
import { useAuthStore } from "@/stores/auth.store"
import { useWorkspaceStore } from "@/stores/workspace.store"

const MIN_WORKSPACE_NAME_LENGTH = 2

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export function CreateWorkspacePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const upsertWorkspace = useWorkspaceStore((state) => state.upsertWorkspace)
  const setLastUsedWorkspace = useAuthStore((state) => state.setLastUsedWorkspace)

  const [name, setName] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  const createWorkspaceMutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: async (workspace) => {
      upsertWorkspace(workspace)
      setLastUsedWorkspace({
        id: workspace.id,
        name: workspace.name,
        plan: workspace.plan,
        roleId: "OWNER",
        accessId: null,
      })

      await queryClient.invalidateQueries({ queryKey: ["workspaces"] })
      await queryClient.invalidateQueries({ queryKey: ["workspace", workspace.id, "projects"] })

      navigate(appConfig.auth.redirectAfterLogin, { replace: true })
    },
    onError: (error) => {
      setFormError(resolveErrorMessage(error, "Unable to create workspace. Please try again."))
    },
  })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    const normalizedName = name.trim()

    if (normalizedName.length < MIN_WORKSPACE_NAME_LENGTH) {
      setFormError(`Workspace name must be at least ${MIN_WORKSPACE_NAME_LENGTH} characters long.`)
      return
    }

    createWorkspaceMutation.mutate({ name: normalizedName })
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
      <section className="w-full space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create your first workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your account is ready. Create a workspace to start organizing projects and files.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="workspace-name" className="text-sm font-medium text-foreground">
              Workspace name
            </label>
            <Input
              id="workspace-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Acme Workspace"
              autoFocus
              required
            />
          </div>

          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
          )}

          <Button type="submit" className="h-10 w-full" disabled={createWorkspaceMutation.isPending}>
            {createWorkspaceMutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2Icon className="size-4 animate-spin" />
                Creating workspace...
              </span>
            ) : (
              "Create workspace"
            )}
          </Button>
        </form>
      </section>
    </main>
  )
}
