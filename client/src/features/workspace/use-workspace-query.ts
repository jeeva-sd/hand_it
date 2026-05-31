import { useQuery } from "@tanstack/react-query"

import { getWorkspace } from "@/services/workspace.service"

export function useWorkspaceQuery(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: () => getWorkspace(workspaceId),
    enabled: workspaceId.length > 0,
    staleTime: 60_000,
  })
}
