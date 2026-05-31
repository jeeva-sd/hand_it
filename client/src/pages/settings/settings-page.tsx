import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { appPaths } from "@/app/router/paths"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWorkspaceQuery } from "@/features/workspace/use-workspace-query"
import { ApiError } from "@/services/http.service"
import { deleteWorkspace, selectWorkspace, updateWorkspace } from "@/services/workspace.service"
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
  const { workspaceId = "" } = useParams()
  const queryClient = useQueryClient()

  const workspaces = useWorkspaceStore((state) => state.workspaces)
  const upsertWorkspace = useWorkspaceStore((state) => state.upsertWorkspace)
  const removeWorkspace = useWorkspaceStore((state) => state.removeWorkspace)

  const lastUsedWorkspace = useAuthStore((state) => state.lastUsedWorkspace)
  const setLastUsedWorkspace = useAuthStore((state) => state.setLastUsedWorkspace)
  const { data: workspace, isError: isWorkspaceError, isPending: isWorkspacePending } = useWorkspaceQuery(workspaceId)

  const currentWorkspaceId = workspaceId
  const [nameDraftByWorkspaceId, setNameDraftByWorkspaceId] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ workspaceId: string; text: string } | null>(null)
  const [errorMessage, setErrorMessage] = useState<{ workspaceId: string; text: string } | null>(null)

  const name = currentWorkspaceId
    ? (nameDraftByWorkspaceId[currentWorkspaceId] ?? workspace?.name ?? "")
    : ""

  const updateWorkspaceMutation = useMutation({
    mutationFn: (payload: { workspaceId: string; name: string }) => updateWorkspace(payload.workspaceId, { name: payload.name }),
    onSuccess: async (workspace) => {
      upsertWorkspace(workspace)
      setNameDraftByWorkspaceId((previous) => ({
        ...previous,
        [workspace.id]: workspace.name,
      }))

      if (lastUsedWorkspace?.id === workspace.id) {
        setLastUsedWorkspace({
          ...lastUsedWorkspace,
          name: workspace.name,
          plan: workspace.plan,
        })
      }

      await queryClient.invalidateQueries({ queryKey: ["workspaces"] })
      await queryClient.invalidateQueries({ queryKey: ["workspace", workspace.id] })
      setErrorMessage(null)
      setMessage({ workspaceId: workspace.id, text: "Workspace updated successfully." })
    },
    onError: (error) => {
      setMessage(null)
      setErrorMessage({
        workspaceId: currentWorkspaceId,
        text: resolveErrorMessage(error, "Unable to update workspace right now."),
      })
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

        void selectWorkspace(remainingWorkspaces[0].id).catch(() => undefined)
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
      setMessage(null)
      setErrorMessage({
        workspaceId: currentWorkspaceId,
        text: resolveErrorMessage(error, "Unable to delete workspace right now."),
      })
    },
  })

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!workspace || !currentWorkspaceId) {
      return
    }

    setMessage(null)
    setErrorMessage(null)

    const normalizedName = name.trim()

    if (normalizedName.length < 2) {
      setErrorMessage({
        workspaceId: currentWorkspaceId,
        text: "Workspace name must be at least 2 characters long.",
      })
      return
    }

    updateWorkspaceMutation.mutate({ workspaceId: currentWorkspaceId, name: normalizedName })
  }

  const handleDeleteWorkspace = () => {
    if (!workspace || !currentWorkspaceId) {
      return
    }

    const confirmed = window.confirm(`Delete "${workspace.name}" workspace? This action cannot be undone.`)

    if (!confirmed) {
      return
    }

    setMessage(null)
    setErrorMessage(null)
    deleteWorkspaceMutation.mutate(currentWorkspaceId)
  }

  if (!currentWorkspaceId) {
    return (
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold">Workspace Settings</h2>
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
      <section className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Loading workspace settings...
      </section>
    )
  }

  if (isWorkspaceError || !workspace) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-sm text-red-700">
        Unable to load this workspace from URL right now. Please refresh and try again.
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
            onChange={(event) => {
              if (!currentWorkspaceId) {
                return
              }

              setNameDraftByWorkspaceId((previous) => ({
                ...previous,
                [currentWorkspaceId]: event.target.value,
              }))
            }}
            placeholder="Workspace name"
            required
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Plan: {workspace.plan}</span>
          <span>-</span>
          <span>{workspace.memberCount} members</span>
        </div>

        {message?.workspaceId === currentWorkspaceId && <p className="text-sm text-emerald-600">{message.text}</p>}
        {errorMessage?.workspaceId === currentWorkspaceId && <p className="text-sm text-red-600">{errorMessage.text}</p>}

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
