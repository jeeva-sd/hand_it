import { useQuery } from "@tanstack/react-query"

import { getWorkspaceProject } from "@/services/workspace.service"

export function useProjectQuery(workspaceId: string, projectId: string, enabled = true) {
  return useQuery({
    queryKey: ["workspace", workspaceId, "projects", projectId],
    queryFn: () => getWorkspaceProject(workspaceId, projectId),
    enabled: enabled && workspaceId.length > 0 && projectId.length > 0,
    staleTime: 60_000,
  })
}
