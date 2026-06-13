import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, type FormEvent, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { appPaths } from "@/app/router/paths"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWorkspaceQuery } from "@/features/workspace/use-workspace-query"
import { ApiError } from "@/services/http.service"
import { deleteWorkspace, selectWorkspace, updateWorkspace } from "@/services/workspace.service"
import { useAuthStore } from "@/stores/auth.store"
import { useWorkspaceStore } from "@/stores/workspace.store"
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

  // Local settings states matching the design UX switches
  const [workspaceName, setWorkspaceName] = useState("")
  const [subdomain, setSubdomain] = useState("")
  const [requirePassword, setRequirePassword] = useState(false)
  const [showBranding, setShowBranding] = useState(true)
  const [notifyViews, setNotifyViews] = useState(true)
  const [emailFeedback, setEmailFeedback] = useState(true)
  const [weeklySummary, setWeeklySummary] = useState(false)

  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (workspace) {
      setWorkspaceName(workspace.name)
      setSubdomain(workspace.name.toLowerCase().replace(/[^a-z0-9]/g, "-"))
    }
  }, [workspace])

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
      setErrorMessage(null)
      setMessage("Workspace settings updated successfully.")
    },
    onError: (error) => {
      setMessage(null)
      setErrorMessage(resolveErrorMessage(error, "Unable to update workspace right now."))
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

      navigate(
        remainingWorkspaces[0] ? appPaths.workspaceProjects(remainingWorkspaces[0].id) : appPaths.createWorkspace,
        { replace: true }
      )
    },
    onError: (error) => {
      setMessage(null)
      setErrorMessage(resolveErrorMessage(error, "Unable to delete workspace right now."))
    },
  })

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!workspace || !workspaceId) return

    setMessage(null)
    setErrorMessage(null)

    const normalizedName = workspaceName.trim()
    if (normalizedName.length < 2) {
      setErrorMessage("Workspace name must be at least 2 characters long.")
      return
    }

    updateWorkspaceMutation.mutate({ workspaceId, name: normalizedName })
  }

  const handleDeleteWorkspace = () => {
    if (!workspace || !workspaceId) return

    const confirmed = window.confirm(`Delete "${workspace.name}" workspace? This action cannot be undone.`)
    if (!confirmed) return

    setMessage(null)
    setErrorMessage(null)
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

  const workspaceInitials = workspace.name.slice(0, 2).toUpperCase()

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Workspace preferences, branding, and defaults.</p>
      </header>

      {message && <p className="mb-6 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">{message}</p>}
      {errorMessage && <p className="mb-6 rounded-lg bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive">{errorMessage}</p>}

      <form onSubmit={handleSave}>
        <Section title="Workspace">
          <Field label="Workspace name">
            <Input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} required />
          </Field>
          <Field label="Subdomain">
            <div className="flex items-center gap-1">
              <Input value={subdomain} onChange={(e) => setSubdomain(e.target.value)} className="rounded-r-none" />
              <span className="rounded-md rounded-l-none border border-l-0 bg-muted px-3 py-2 text-sm text-muted-foreground">
                .handit.app
              </span>
            </div>
          </Field>
          <Field label="Workspace logo" hint="Shown on client-facing share pages.">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
                {workspaceInitials}
              </div>
              <Button type="button" variant="outline" size="sm">
                Upload
              </Button>
            </div>
          </Field>
        </Section>

        <Section title="Share defaults" hint="Applied to every new share link unless overridden.">
          <Toggle label="Require password by default" checked={requirePassword} onChange={setRequirePassword} />
          <Toggle label="Show your branding on share pages" checked={showBranding} onChange={setShowBranding} />
          <Toggle label="Notify me when a client views a share" checked={notifyViews} onChange={setNotifyViews} />
        </Section>

        <Section title="Notifications">
          <Toggle label="Email me when clients leave feedback" checked={emailFeedback} onChange={setEmailFeedback} />
          <Toggle label="Weekly delivery summary" checked={weeklySummary} onChange={setWeeklySummary} />
        </Section>

        <div className="mt-6">
          <Button type="submit" disabled={updateWorkspaceMutation.isPending}>
            {updateWorkspaceMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>

      <Section title="Danger zone" className="mt-12">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
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

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onChange={onChange} />
    </div>
  )
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
        checked ? "bg-primary" : "bg-input"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg transition-transform",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  )
}
