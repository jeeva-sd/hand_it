import { useQuery } from "@tanstack/react-query"

import { getProject } from "@/services/project.service"

export function useProjectQuery(workspaceId: string, projectId: string, enabled = true) {
  return useQuery({
    queryKey: ["workspace", workspaceId, "projects", projectId],
    queryFn: () => getProject(workspaceId, projectId),
    enabled: enabled && workspaceId.length > 0 && projectId.length > 0,
    staleTime: 60_000,
  })
}
