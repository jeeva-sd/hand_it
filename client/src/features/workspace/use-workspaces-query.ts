import { useQuery } from "@tanstack/react-query"

import { listWorkspaces } from "@/services/workspace.service"

export function useWorkspacesQuery(enabled = true) {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: listWorkspaces,
    enabled,
    staleTime: 60_000,
  })
}
