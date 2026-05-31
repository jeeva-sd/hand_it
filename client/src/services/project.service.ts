import type { Project, PaginatedProjects } from "@/types/workspace"

import { apiRequest } from "./http.service"

function formatProjectUpdatedAt(value: string): string {
  const timestamp = Date.parse(value)

  if (Number.isNaN(timestamp)) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp))
}

export async function listProjects(
  workspaceId: string,
  params: {
    page?: number
    size?: number
    searchTerm?: string
    status?: string
    sortOrder?: "asc" | "desc"
  } = {}
): Promise<PaginatedProjects> {
  const queryParams = new URLSearchParams()
  if (params.page !== undefined) queryParams.append("page", params.page.toString())
  if (params.size !== undefined) queryParams.append("size", params.size.toString())
  if (params.searchTerm !== undefined && params.searchTerm.trim() !== "") {
    queryParams.append("searchTerm", params.searchTerm.trim())
  }
  if (params.status !== undefined && params.status !== "all" && params.status !== "") {
    queryParams.append("status", params.status.toUpperCase()) // DB has uppercase enums
  }
  if (params.sortOrder !== undefined) queryParams.append("sortOrder", params.sortOrder)

  const queryString = queryParams.toString()
  const path = `/workspaces/${workspaceId}/projects${queryString ? `?${queryString}` : ""}`

  const response = await apiRequest<PaginatedProjects>(path, {
    method: "GET",
  })

  return {
    ...response,
    projects: response.projects.map((project) => ({
      ...project,
      updatedAt: formatProjectUpdatedAt(project.updatedAt),
    })),
  }
}

export async function getProject(workspaceId: string, projectId: string): Promise<Project> {
  const response = await apiRequest<{ project: Project }>(`/workspaces/${workspaceId}/projects/${projectId}`, {
    method: "GET",
  })

  return {
    ...response.project,
    updatedAt: formatProjectUpdatedAt(response.project.updatedAt),
  }
}

export async function createProject(
  workspaceId: string,
  payload: { name: string; description?: string | null; status?: string }
): Promise<Project> {
  const response = await apiRequest<{ project: Project }, typeof payload>(`/workspaces/${workspaceId}/projects`, {
    method: "POST",
    body: payload,
  })

  return response.project
}

export async function updateProject(
  workspaceId: string,
  projectId: string,
  payload: { name?: string; description?: string | null; status?: string }
): Promise<Project> {
  const response = await apiRequest<{ project: Project }, typeof payload>(
    `/workspaces/${workspaceId}/projects/${projectId}`,
    {
      method: "PATCH",
      body: payload,
    }
  )

  return response.project
}

export async function deleteProject(workspaceId: string, projectId: string): Promise<void> {
  await apiRequest<unknown>(`/workspaces/${workspaceId}/projects/${projectId}`, {
    method: "DELETE",
  })
}

export async function favoriteProject(workspaceId: string, projectId: string): Promise<void> {
  await apiRequest<unknown>(`/workspaces/${workspaceId}/projects/${projectId}/favorite`, {
    method: "POST",
  })
}

export async function unfavoriteProject(workspaceId: string, projectId: string): Promise<void> {
  await apiRequest<unknown>(`/workspaces/${workspaceId}/projects/${projectId}/favorite`, {
    method: "DELETE",
  })
}
