import { create } from "zustand"

import { workspaceList } from "@/features/workspace/workspace.data"
import type { Workspace } from "@/types/workspace"

type WorkspaceStore = {
  workspaces: Workspace[]
  activeWorkspaceId: string
  setActiveWorkspace: (workspaceId: string) => void
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspaces: workspaceList,
  activeWorkspaceId: workspaceList[0]?.id ?? "",
  setActiveWorkspace: (workspaceId) => {
    const exists = get().workspaces.some((workspace) => workspace.id === workspaceId)

    if (!exists) {
      return
    }

    set({ activeWorkspaceId: workspaceId })
  },
}))
