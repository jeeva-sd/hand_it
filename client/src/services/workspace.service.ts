import { workspaceProjects } from "@/features/workspace/workspace.data"
import type { Project } from "@/types/workspace"

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function getProjectsByWorkspace(workspaceId: string): Promise<Project[]> {
  // Small delay to mimic an async API and show Query usage in the demo pages.
  await wait(180)

  return (workspaceProjects[workspaceId] ?? []).map((project) => ({
    ...project,
  }))
}
