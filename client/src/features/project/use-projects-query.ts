import { useQuery } from "@tanstack/react-query"

import { listProjects } from "@/services/project.service"

interface ProjectsQueryOptions {
  page?: number
  size?: number
  searchTerm?: string
  status?: string
  sortOrder?: "asc" | "desc"
  enabled?: boolean
}

export function useProjectsQuery(workspaceId: string, options: ProjectsQueryOptions = {}) {
  const { enabled = true, page = 1, size = 10, searchTerm = "", status = "all", sortOrder = "desc" } = options

  return useQuery({
    queryKey: ["workspace", workspaceId, "projects", { page, size, searchTerm, status, sortOrder }],
    queryFn: () => listProjects(workspaceId, { page, size, searchTerm, status, sortOrder }),
    enabled: enabled && workspaceId.length > 0,
    staleTime: 60_000,
  })
}
