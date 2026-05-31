export const projectSections = ["files", "shares", "activity"] as const

export type ProjectSection = (typeof projectSections)[number]

export function isProjectSection(value: string | null | undefined): value is ProjectSection {
  return value === "files" || value === "shares" || value === "activity"
}

export const appPaths = {
  authLogin: "/auth/login",
  postLogin: "/post-login",
  createWorkspace: "/workspace/create",
  workspaceRoot: (workspaceId: string) => `/w/${workspaceId}`,
  workspaceProjects: (workspaceId: string) => `/w/${workspaceId}/projects`,
  workspaceProject: (workspaceId: string, projectId: string) => `/w/${workspaceId}/projects/${projectId}`,
  workspaceProjectSection: (workspaceId: string, projectId: string, section: ProjectSection) =>
    `/w/${workspaceId}/projects/${projectId}/${section}`,
  workspaceSettings: (workspaceId: string) => `/w/${workspaceId}/settings`,
  workspaceMembers: (workspaceId: string) => `/w/${workspaceId}/settings/members`,
  workspaceBilling: (workspaceId: string) => `/w/${workspaceId}/settings/billing`,
}

export function replaceWorkspaceInPath(pathname: string, workspaceId: string): string {
  const workspacePrefixPattern = /^\/w\/[^/]+/

  if (!workspacePrefixPattern.test(pathname)) {
    return appPaths.workspaceProjects(workspaceId)
  }

  return pathname.replace(workspacePrefixPattern, appPaths.workspaceRoot(workspaceId))
}

export function resolveWorkspaceSwitchPath(pathname: string, workspaceId: string): string {
  const relativePath = pathname.replace(/^\/w\/[^/]+/, "")

  if (relativePath.startsWith("/projects/")) {
    return appPaths.workspaceProjects(workspaceId)
  }

  if (relativePath.length === 0 || relativePath === "/") {
    return appPaths.workspaceProjects(workspaceId)
  }

  return `${appPaths.workspaceRoot(workspaceId)}${relativePath}`
}