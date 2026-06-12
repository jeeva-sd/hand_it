import type { Project, Workspace, WorkspaceMember } from "@/types/workspace"

import { apiRequest } from "./http.service"

type WorkspaceListResponse = {
  total: number
  workspaces: Workspace[]
}

type WorkspaceDetailResponse = {
  workspace: Workspace
}

type CreateWorkspaceRequest = {
  name: string
}

type UpdateWorkspaceRequest = {
  name: string
}

type UpdateWorkspaceResponse = {
  workspace: Workspace
}

type SelectWorkspaceResponse = {
  workspace: Workspace
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

type MembersListResponse = {
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
  const response = await apiRequest<WorkspaceDetailResponse>(`/workspaces/${workspaceId}`, {
    method: "GET",
  })

  return response.workspace
}

export async function createWorkspace(payload: CreateWorkspaceRequest): Promise<Workspace> {
  const response = await apiRequest<{ id: string }, CreateWorkspaceRequest>("/workspaces", {
    method: "POST",
    body: payload,
  })

  return getWorkspace(response.id)
}

export async function updateWorkspace(workspaceId: string, payload: UpdateWorkspaceRequest): Promise<Workspace> {
  const response = await apiRequest<UpdateWorkspaceResponse, UpdateWorkspaceRequest>(`/workspaces/${workspaceId}`, {
    method: "PATCH",
    body: payload,
  })

  return response.workspace
}

export async function deleteWorkspace(workspaceId: string): Promise<DeleteWorkspaceResponse> {
  return apiRequest<DeleteWorkspaceResponse>(`/workspaces/${workspaceId}`, {
    method: "DELETE",
  })
}

export async function listWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const response = await apiRequest<MembersListResponse>(`/workspaces/${workspaceId}/members`, {
    method: "GET",
  })

  return response.members
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
  const response = await apiRequest<SelectWorkspaceResponse>(`/workspaces/${workspaceId}/select`, {
    method: "PATCH",
  })

  return response.workspace
}
