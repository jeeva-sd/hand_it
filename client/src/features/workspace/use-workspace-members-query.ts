import { useQuery, useInfiniteQuery } from "@tanstack/react-query"

import { listWorkspaceMembers } from "@/services/workspace.service"

export function useWorkspaceMembersQuery(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace", workspaceId, "members"],
    queryFn: async () => {
      const response = await listWorkspaceMembers(workspaceId)
      return response.members
    },
    enabled: workspaceId.length > 0,
    staleTime: 60_000,
  })
}

export function useWorkspaceMembersInfiniteQuery(workspaceId: string, searchTerm: string = "") {
  return useInfiniteQuery({
    queryKey: ["workspace", workspaceId, "members", "infinite", searchTerm],
    queryFn: async ({ pageParam = 1 }) => {
      return listWorkspaceMembers(workspaceId, {
        page: pageParam as number,
        size: 10,
        searchTerm,
      })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loadedAmount = allPages.reduce((sum, page) => sum + page.members.length, 0)
      if (loadedAmount < lastPage.total) {
        return allPages.length + 1
      }
      return undefined
    },
    enabled: workspaceId.length > 0,
    staleTime: 60_000,
  })
}
