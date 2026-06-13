import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, type FormEvent, useEffect, useRef, type ChangeEvent } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { appPaths } from "@/app/router/paths"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/ui"
import { WorkspaceAvatar } from "@/components/workspace-avatar"
import { useWorkspaceQuery } from "@/features/workspace/use-workspace-query"
import { ApiError } from "@/services/http.service"
import { deleteWorkspace, selectWorkspace, updateWorkspace, uploadWorkspaceLogo } from "@/services/workspace.service"
import { useAuthStore } from "@/stores/auth.store"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { toast } from "@/stores/toast.store"
import { cn } from "@/lib/utils"

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

  // Local settings states matching the active workspace model properties
  const [workspaceName, setWorkspaceName] = useState("")
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (workspace) {
      setWorkspaceName(workspace.name)
    }
  }, [workspace])

  const uploadLogoMutation = useMutation({
    mutationFn: (payload: FormData) => uploadWorkspaceLogo(workspaceId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] })
      await queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] })
      toast.success("Workspace logo uploaded successfully.")
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, "Unable to upload workspace logo right now."))
    },
  })

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 1 * 1024 * 1024) {
      toast.error("File size must be less than 1MB.")
      return
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Only JPG and PNG formats are supported.")
      return
    }

    const formData = new FormData()
    formData.append("logo", file)
    uploadLogoMutation.mutate(formData)
  }

  const triggerLogoSelect = () => {
    fileInputRef.current?.click()
  }

  const updateWorkspaceMutation = useMutation({
    mutationFn: (payload: { workspaceId: string; name: string }) =>
      updateWorkspace(payload.workspaceId, { name: payload.name }),
    onSuccess: async (updated) => {
      upsertWorkspace(updated)
      if (lastUsedWorkspace?.id === updated.id) {
        setLastUsedWorkspace({
          ...lastUsedWorkspace,
          name: updated.name,
          plan: updated.plan,
        })
      }

      await queryClient.invalidateQueries({ queryKey: ["workspaces"] })
      await queryClient.invalidateQueries({ queryKey: ["workspace", updated.id] })
      toast.success("Workspace settings updated successfully.")
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, "Unable to update workspace right now."))
    },
  })

  const deleteWorkspaceMutation = useMutation({
    mutationFn: (id: string) => deleteWorkspace(id),
    onSuccess: async (_, deletedId) => {
      const remainingWorkspaces = workspaces.filter((w) => w.id !== deletedId)

      removeWorkspace(deletedId)

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
      toast.success("Workspace deleted successfully.")

      navigate(
        remainingWorkspaces[0] ? appPaths.workspaceProjects(remainingWorkspaces[0].id) : appPaths.createWorkspace,
        { replace: true }
      )
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, "Unable to delete workspace right now."))
    },
  })

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!workspace || !workspaceId) return

    const normalizedName = workspaceName.trim()
    if (normalizedName.length < 2) {
      toast.error("Workspace name must be at least 2 characters long.")
      return
    }

    updateWorkspaceMutation.mutate({ workspaceId, name: normalizedName })
  }

  const handleDeleteWorkspace = () => {
    if (!workspace || !workspaceId) return
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!workspace || !workspaceId) return
    deleteWorkspaceMutation.mutate(workspaceId)
  }

  if (!workspaceId) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-10">
        <h1 className="text-2xl font-semibold">Workspace Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Workspace route is missing. Please open a valid workspace.</p>
      </div>
    )
  }

  if (isWorkspacePending) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-10 text-center text-sm text-muted-foreground">
        Loading workspace settings...
      </div>
    )
  }

  if (isWorkspaceError || !workspace) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-10 text-center text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
        Unable to load workspace settings. Please refresh and try again.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Workspace preferences, branding, and defaults.</p>
      </header>

      <form onSubmit={handleSave}>
        <Section title="Workspace">
          <Field label="Workspace name">
            <Input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} required />
          </Field>
          <Field label="Workspace logo" hint="Shown on client-facing share pages.">
            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg"
                onChange={handleLogoChange}
              />
              <WorkspaceAvatar
                name={workspace.name}
                logoUrl={workspace.logoUrl}
                updatedAt={workspace.updatedAt}
                className="h-12 w-12 border"
                fallbackClassName="text-base font-semibold"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={triggerLogoSelect}
                disabled={uploadLogoMutation.isPending}
              >
                {uploadLogoMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </Field>
        </Section>

        <div className="mt-6">
          <Button type="submit" disabled={updateWorkspaceMutation.isPending}>
            {updateWorkspaceMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>

      <Section title="Danger zone" className="mt-12">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
          <h3 className="text-sm font-semibold">Delete workspace</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Permanently delete this workspace and all projects, files, and shares.
          </p>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="mt-3"
            onClick={handleDeleteWorkspace}
            disabled={deleteWorkspaceMutation.isPending}
          >
            {deleteWorkspaceMutation.isPending ? "Deleting..." : "Delete workspace"}
          </Button>
        </div>
      </Section>

      <ConfirmDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Delete Workspace"
        description={`Are you sure you want to delete the "${workspace?.name}" workspace? This action is permanent and cannot be undone.`}
        confirmText="Delete Workspace"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        variant="destructive"
        isLoading={deleteWorkspaceMutation.isPending}
      />
    </div>
  )
}

function Section({
  title,
  hint,
  children,
  className,
}: {
  title: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("mb-10", className)}>
      <div className="mb-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[180px_1fr] sm:items-center">
      <div>
        <label className="text-sm font-medium">{label}</label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  )
}


