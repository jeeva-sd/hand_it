import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"

import { appPaths } from "@/app/router/paths"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/services/http.service"
import { deleteWorkspace, updateWorkspace } from "@/services/workspace.service"
import { useAuthStore } from "@/stores/auth.store"
import { useWorkspaceStore } from "@/stores/workspace.store"

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export function SettingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const workspaces = useWorkspaceStore((state) => state.workspaces)
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId)
  const upsertWorkspace = useWorkspaceStore((state) => state.upsertWorkspace)
  const removeWorkspace = useWorkspaceStore((state) => state.removeWorkspace)

  const lastUsedWorkspace = useAuthStore((state) => state.lastUsedWorkspace)
  const setLastUsedWorkspace = useAuthStore((state) => state.setLastUsedWorkspace)

  const activeWorkspace = useMemo(() => {
    if (activeWorkspaceId) {
      return workspaces.find((workspace) => workspace.id === activeWorkspaceId)
    }

    return workspaces[0]
  }, [activeWorkspaceId, workspaces])

  const [name, setName] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    setName(activeWorkspace?.name ?? "")
    setMessage(null)
    setErrorMessage(null)
  }, [activeWorkspace?.id, activeWorkspace?.name])

  const updateWorkspaceMutation = useMutation({
    mutationFn: (payload: { workspaceId: string; name: string }) => updateWorkspace(payload.workspaceId, { name: payload.name }),
    onSuccess: async (workspace) => {
      upsertWorkspace(workspace)

      if (lastUsedWorkspace?.id === workspace.id) {
        setLastUsedWorkspace({
          ...lastUsedWorkspace,
          name: workspace.name,
          plan: workspace.plan,
        })
      }

      await queryClient.invalidateQueries({ queryKey: ["workspaces"] })
      setMessage("Workspace updated successfully.")
    },
    onError: (error) => {
      setErrorMessage(resolveErrorMessage(error, "Unable to update workspace right now."))
    },
  })

  const deleteWorkspaceMutation = useMutation({
    mutationFn: (workspaceId: string) => deleteWorkspace(workspaceId),
    onSuccess: async (_, workspaceId) => {
      const remainingWorkspaces = workspaces.filter((workspace) => workspace.id !== workspaceId)

      removeWorkspace(workspaceId)

      if (remainingWorkspaces[0]) {
        setLastUsedWorkspace({
          id: remainingWorkspaces[0].id,
          name: remainingWorkspaces[0].name,
          plan: remainingWorkspaces[0].plan,
          roleId: null,
          accessId: null,
        })
      } else {
        setLastUsedWorkspace(null)
      }

      await queryClient.invalidateQueries({ queryKey: ["workspaces"] })

      navigate(
        remainingWorkspaces[0] ? appPaths.workspaceProjects(remainingWorkspaces[0].id) : appPaths.createWorkspace,
        { replace: true }
      )
    },
    onError: (error) => {
      setErrorMessage(resolveErrorMessage(error, "Unable to delete workspace right now."))
    },
  })

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!activeWorkspace) {
      return
    }

    setMessage(null)
    setErrorMessage(null)

    const normalizedName = name.trim()

    if (normalizedName.length < 2) {
      setErrorMessage("Workspace name must be at least 2 characters long.")
      return
    }

    updateWorkspaceMutation.mutate({ workspaceId: activeWorkspace.id, name: normalizedName })
  }

  const handleDeleteWorkspace = () => {
    if (!activeWorkspace) {
      return
    }

    const confirmed = window.confirm(`Delete "${activeWorkspace.name}" workspace? This action cannot be undone.`)

    if (!confirmed) {
      return
    }

    setMessage(null)
    setErrorMessage(null)
    deleteWorkspaceMutation.mutate(activeWorkspace.id)
  }

  if (!activeWorkspace) {
    return (
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold">Workspace Settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create a workspace to manage workspace settings.</p>
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
        <h2 className="text-2xl font-semibold">Workspace Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Update your workspace details or permanently delete it.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="space-y-1.5">
          <label htmlFor="workspace-name" className="text-sm font-medium text-foreground">
            Workspace name
          </label>
          <Input
            id="workspace-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Workspace name"
            required
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Plan: {activeWorkspace.plan}</span>
          <span>-</span>
          <span>{activeWorkspace.memberCount} members</span>
        </div>

        {message && <p className="text-sm text-emerald-600">{message}</p>}
        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

        <Button type="submit" disabled={updateWorkspaceMutation.isPending || deleteWorkspaceMutation.isPending}>
          {updateWorkspaceMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>

      <section className="space-y-3 rounded-2xl border border-red-200 bg-red-50/50 p-5">
        <div>
          <h3 className="text-lg font-medium text-red-700">Danger Zone</h3>
          <p className="mt-1 text-sm text-red-600">
            Deleting a workspace removes projects and member access for everyone in this workspace.
          </p>
        </div>

        <Button
          type="button"
          variant="destructive"
          onClick={handleDeleteWorkspace}
          disabled={updateWorkspaceMutation.isPending || deleteWorkspaceMutation.isPending}
        >
          {deleteWorkspaceMutation.isPending ? "Deleting..." : "Delete Workspace"}
        </Button>
      </section>
    </section>
  )
}
