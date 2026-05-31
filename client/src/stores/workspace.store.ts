import { create } from "zustand"

import type { Workspace } from "@/types/workspace"

type WorkspaceStore = {
  workspaces: Workspace[]
  activeWorkspaceId: string
  setWorkspaces: (workspaces: Workspace[]) => void
  upsertWorkspace: (workspace: Workspace) => void
  removeWorkspace: (workspaceId: string) => void
  setActiveWorkspace: (workspaceId: string) => void
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: "",
  setWorkspaces: (workspaces) => {
    const currentWorkspaces = get().workspaces
    const currentActiveWorkspaceId = get().activeWorkspaceId
    const nextActiveWorkspaceId = currentActiveWorkspaceId
      ? currentActiveWorkspaceId
      : workspaces[0]?.id ?? ""

    const isSameWorkspaces =
      currentWorkspaces.length === workspaces.length &&
      currentWorkspaces.every((workspace, index) => workspace.id === workspaces[index]?.id)

    if (isSameWorkspaces && currentActiveWorkspaceId === nextActiveWorkspaceId) {
      return
    }

    set({
      workspaces,
      activeWorkspaceId: nextActiveWorkspaceId,
    })
  },
  upsertWorkspace: (workspace) => {
    const existingWorkspaces = get().workspaces
    const existingWorkspaceIndex = existingWorkspaces.findIndex((item) => item.id === workspace.id)

    const workspaces =
      existingWorkspaceIndex >= 0
        ? existingWorkspaces.map((item) => (item.id === workspace.id ? workspace : item))
        : [workspace, ...existingWorkspaces]

    set({
      workspaces,
      activeWorkspaceId: workspace.id,
    })
  },
  removeWorkspace: (workspaceId) => {
    const currentWorkspaces = get().workspaces

    if (!currentWorkspaces.some((workspace) => workspace.id === workspaceId)) {
      return
    }

    const nextWorkspaces = currentWorkspaces.filter((workspace) => workspace.id !== workspaceId)
    const currentActiveWorkspaceId = get().activeWorkspaceId
    const nextActiveWorkspaceId =
      currentActiveWorkspaceId === workspaceId ? nextWorkspaces[0]?.id ?? "" : currentActiveWorkspaceId

    set({
      workspaces: nextWorkspaces,
      activeWorkspaceId: nextActiveWorkspaceId,
    })
  },
  setActiveWorkspace: (workspaceId) => {
    if (get().activeWorkspaceId === workspaceId) {
      return
    }

    set({ activeWorkspaceId: workspaceId })
  },
}))
