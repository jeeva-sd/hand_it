import type { Project, Workspace, WorkspaceMember } from "@/types/workspace"

import { apiRequest } from "./http.service"

type WorkspaceListResponse = {
  workspaces: Workspace[]
}

type CreateWorkspaceRequest = {
  name: string
}

type CreateWorkspaceResponse = {
  workspace: Workspace
}

type UpdateWorkspaceRequest = {
  name: string
}

type UpdateWorkspaceResponse = {
  workspace: Workspace
}

type DeleteWorkspaceResponse = {
  message: string
}

type ProjectsListResponse = {
  projects: Project[]
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

export async function listWorkspaces(): Promise<Workspace[]> {
  const response = await apiRequest<WorkspaceListResponse>("/workspaces", {
    method: "GET",
  })

  return response.workspaces
}

export async function createWorkspace(payload: CreateWorkspaceRequest): Promise<Workspace> {
  const response = await apiRequest<CreateWorkspaceResponse, CreateWorkspaceRequest>("/workspaces", {
    method: "POST",
    body: payload,
  })

  return response.workspace
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
