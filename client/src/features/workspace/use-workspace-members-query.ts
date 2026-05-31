import { useQuery } from "@tanstack/react-query"

import { listWorkspaceMembers } from "@/services/workspace.service"

export function useWorkspaceMembersQuery(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace", workspaceId, "members"],
    queryFn: () => listWorkspaceMembers(workspaceId),
    enabled: workspaceId.length > 0,
    staleTime: 60_000,
  })
}
