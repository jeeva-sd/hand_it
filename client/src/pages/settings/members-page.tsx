import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  useWorkspaceMembersInfiniteQuery,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
} from "@/features/workspace-members/queries"
import { RoleHintsSection } from "@/features/workspace-members/components/role-hints"
import { InviteMemberForm } from "@/features/workspace-members/components/invite-form"
import { MemberSearchInput } from "@/features/workspace-members/components/search-input"
import { MembersTable } from "@/features/workspace-members/components/members-table"
import { type AppRole, roleMapToBackend } from "@/features/workspace-members/types"
import { useAuthStore } from "@/stores/auth.store"
import { useWorkspaceQuery } from "@/features/workspace/use-workspace-query"
import { resolveApiError } from "@/services/http.service"

export function MembersPage() {
  const { workspaceId = "" } = useParams()
  const currentUser = useAuthStore((state) => state.user)

  // Fetch workspace details directly by ID (scale-safe, handles paginated lists gracefully)
  const { data: workspace } = useWorkspaceQuery(workspaceId)
  const isFreePlan = workspace?.plan?.toUpperCase() === "FREE"
  const workspaceName = workspace?.name || "the workspace"

  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch paginated member records in infinite scroll
  const {
    data,
    isPending,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useWorkspaceMembersInfiniteQuery(workspaceId, debouncedSearch)

  const members = data?.pages.flatMap((page) => page.members) ?? []

  // Setup infinite scroll observer
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchNextPage()
        }
      },
      { threshold: 0.5 }
    )

    const target = document.getElementById("infinite-scroll-trigger")
    if (target) {
      observer.observe(target)
    }

    return () => {
      if (target) {
        observer.unobserve(target)
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Mutation hooks
  const updateRoleMutation = useUpdateMemberRoleMutation(
    workspaceId,
    () => {
      setSuccessMessage("Member role updated successfully.")
      setErrorMessage(null)
      void refetch()
    },
    (err) => {
      setSuccessMessage(null)
      setErrorMessage(resolveApiError(err, "Failed to update member role."))
    }
  )

  const removeMemberMutation = useRemoveMemberMutation(
    workspaceId,
    () => {
      setSuccessMessage("Member removed successfully.")
      setErrorMessage(null)
      void refetch()
    },
    (err) => {
      setSuccessMessage(null)
      setErrorMessage(resolveApiError(err, "Failed to remove member."))
    }
  )

  // Callbacks wrapped in useCallback to prevent child row components from re-rendering
  const handleRoleChange = useCallback((memberId: string, role: AppRole) => {
    if (isFreePlan) return
    setErrorMessage(null)
    setSuccessMessage(null)
    updateRoleMutation.mutate({ memberId, role: roleMapToBackend[role] })
  }, [isFreePlan, updateRoleMutation])

  const handleRemove = useCallback((memberId: string, name: string) => {
    if (isFreePlan) return
    const confirmed = window.confirm(`Remove ${name} from this workspace?`)
    if (!confirmed) return
    setErrorMessage(null)
    setSuccessMessage(null)
    removeMemberMutation.mutate(memberId)
  }, [isFreePlan, removeMemberMutation])

  const handleFormSuccess = useCallback((msg: string) => {
    setSuccessMessage(msg)
    setErrorMessage(null)
    void refetch()
  }, [refetch])

  const handleFormError = useCallback((msg: string) => {
    setSuccessMessage(null)
    setErrorMessage(msg)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setDebouncedSearch(value)
  }, [])

  if (!workspaceId) {
    return (
      <div className="mx-auto max-w-5xl px-8 py-10">
        <h1 className="text-2xl font-semibold">Members</h1>
        <p className="mt-1 text-sm text-muted-foreground">Workspace ID is missing.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Three roles. Nothing complicated.
          </p>
        </div>
      </header>

      {isFreePlan && (
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Members can be viewed, but inviting or modifying workspace access requires a Pro plan.
        </div>
      )}

      {isError && (
        <p className="mb-6 rounded-lg bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {resolveApiError(error, "Unable to load members. Please refresh and try again.")}
        </p>
      )}

      {successMessage && <p className="mb-6 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">{successMessage}</p>}
      {errorMessage && <p className="mb-6 rounded-lg bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive">{errorMessage}</p>}

      <InviteMemberForm
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        isFreePlan={isFreePlan}
        onSuccess={handleFormSuccess}
        onError={handleFormError}
      />

      <RoleHintsSection />

      <MemberSearchInput onSearchChange={handleSearchChange} />

      <MembersTable
        members={members}
        currentUserId={currentUser?.id ?? ""}
        isFreePlan={isFreePlan}
        isLoading={isPending}
        onRoleChange={handleRoleChange}
        onRemove={handleRemove}
      />

      {/* Scroll observer element */}
      <div id="infinite-scroll-trigger" className="h-4 w-full" />

      {isFetchingNextPage && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Loading more members...
        </div>
      )}

      {!isFetchingNextPage && hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={() => void fetchNextPage()}
            className="text-xs"
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
