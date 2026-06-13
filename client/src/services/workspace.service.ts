import type { Project, Workspace, WorkspaceMember } from "@/types/workspace"

import { apiRequest } from "./http.service"

type WorkspaceListResponse = {
  total: number
  workspaces: Workspace[]
}

type CreateWorkspaceRequest = {
  name: string
}

type UpdateWorkspaceRequest = {
  name: string
}

type DeleteWorkspaceResponse = {
  message: string
}

type ProjectsListResponse = {
  projects: Project[]
}

type ProjectDetailResponse = {
  project: Project
}

export type MembersListResponse = {
  total: number
  members: WorkspaceMember[]
}

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

export async function listWorkspaces(
  params: {
    page?: number
    size?: number
    searchTerm?: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
  } = {}
): Promise<{ total: number; workspaces: Workspace[] }> {
  const queryParams = new URLSearchParams()
  if (params.page !== undefined) queryParams.append("page", params.page.toString())
  if (params.size !== undefined) queryParams.append("size", params.size.toString())
  if (params.searchTerm !== undefined && params.searchTerm.trim() !== "") {
    queryParams.append("searchTerm", params.searchTerm.trim())
  }
  if (params.sortBy !== undefined) queryParams.append("sortBy", params.sortBy)
  if (params.sortOrder !== undefined) queryParams.append("sortOrder", params.sortOrder)

  const queryString = queryParams.toString()
  const path = `/workspaces${queryString ? `?${queryString}` : ""}`

  return apiRequest<WorkspaceListResponse>(path, {
    method: "GET",
  })
}

export async function getWorkspace(workspaceId: string): Promise<Workspace> {
  return apiRequest<Workspace>(`/workspaces/${workspaceId}`, {
    method: "GET",
  })
}

export async function createWorkspace(payload: CreateWorkspaceRequest): Promise<Workspace> {
  const response = await apiRequest<{ id: string }, CreateWorkspaceRequest>("/workspaces", {
    method: "POST",
    body: payload,
  })

  return getWorkspace(response.id)
}

export async function updateWorkspace(workspaceId: string, payload: UpdateWorkspaceRequest): Promise<Workspace> {
  return apiRequest<Workspace, UpdateWorkspaceRequest>(`/workspaces/${workspaceId}`, {
    method: "PATCH",
    body: payload,
  })
}

export async function deleteWorkspace(workspaceId: string): Promise<DeleteWorkspaceResponse> {
  return apiRequest<DeleteWorkspaceResponse>(`/workspaces/${workspaceId}`, {
    method: "DELETE",
  })
}

export async function listWorkspaceMembers(
  workspaceId: string,
  params?: { page?: number; size?: number; searchTerm?: string }
): Promise<MembersListResponse> {
  const queryParams = new URLSearchParams()
  if (params) {
    if (params.page !== undefined) queryParams.append("page", params.page.toString())
    if (params.size !== undefined) queryParams.append("size", params.size.toString())
    if (params.searchTerm !== undefined && params.searchTerm.trim() !== "") {
      queryParams.append("searchTerm", params.searchTerm.trim())
    }
  }

  const queryString = queryParams.toString()
  const path = `/workspaces/${workspaceId}/members${queryString ? `?${queryString}` : ""}`

  return apiRequest<MembersListResponse>(path, {
    method: "GET",
  })
}

export async function getProjectsByWorkspace(workspaceId: string): Promise<Project[]> {
  const response = await apiRequest<ProjectsListResponse>(`/workspaces/${workspaceId}/projects`, {
    method: "GET",
  })

  return response.projects.map((project) => ({
    ...project,
    updatedAt: formatProjectUpdatedAt(project.updatedAt),
  }))
}

export async function getWorkspaceProject(workspaceId: string, projectId: string): Promise<Project> {
  const response = await apiRequest<ProjectDetailResponse>(`/workspaces/${workspaceId}/projects/${projectId}`, {
    method: "GET",
  })

  return {
    ...response.project,
    updatedAt: formatProjectUpdatedAt(response.project.updatedAt),
  }
}

export async function selectWorkspace(workspaceId: string): Promise<Workspace> {
  return apiRequest<Workspace>(`/workspaces/${workspaceId}/select`, {
    method: "PATCH",
  })
}

export async function updateWorkspaceMemberRole(
  workspaceId: string,
  memberId: string,
  role: string
): Promise<{ id: string; role: string }> {
  return apiRequest<{ id: string; role: string }, { workspaceId: string; memberId: string; role: string }>(
    `/workspaces/${workspaceId}/members/${memberId}`,
    {
      method: "PATCH",
      body: { workspaceId, memberId, role },
    }
  )
}

export async function removeWorkspaceMember(workspaceId: string, memberId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/workspaces/${workspaceId}/members/${memberId}`, {
    method: "DELETE",
  })
}

export async function inviteWorkspaceMember(
  workspaceId: string,
  payload: { email: string; role: string }
): Promise<{ message: string }> {
  return apiRequest<{ message: string }, { workspaceId: string; email: string; role: string }>(
    `/workspaces/${workspaceId}/members`,
    {
      method: "POST",
      body: { workspaceId, ...payload },
    }
  )
}

export async function uploadWorkspaceLogo(
  workspaceId: string,
  payload: FormData
): Promise<{ message: string }> {
  return apiRequest<{ message: string }, FormData>(
    `/workspaces/${workspaceId}/logo`,
    {
      method: "PUT",
      body: payload,
    }
  )
}
