import { useQuery } from "@tanstack/react-query"

import { getProjectsByWorkspace } from "@/services/workspace.service"

export function useProjectsQuery(workspaceId: string, enabled = true) {
  return useQuery({
    queryKey: ["workspace", workspaceId, "projects"],
    queryFn: () => getProjectsByWorkspace(workspaceId),
    enabled: enabled && workspaceId.length > 0,
    staleTime: 60_000,
  })
}
