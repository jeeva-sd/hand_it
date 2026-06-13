export type WorkspacePlan = "Free" | "Pro" | "Team"

export type Workspace = {
  id: string
  name: string
  plan: WorkspacePlan
  memberCount: number
}

export type WorkspaceMemberRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"

export type WorkspaceMemberStatus = "INVITED" | "ACTIVE" | "DECLINED" | "DELETED"

export type WorkspaceMember = {
  id: string
  userId: string
  role: WorkspaceMemberRole
  status: WorkspaceMemberStatus
  joinedAt: string
  updatedAt: string
  user: {
    id: string
    fname: string
    lname: string
    email: string
  }
}

export type ProjectStatus = "Active" | "Paused" | "Draft" | "Archived"

export type Project = {
  id: string
  name: string
  description: string
  status: ProjectStatus
  updatedAt: string
  fileCount: number
  shareCount: number
  members: string[]
  isFavorite: boolean
}

export type WorkspaceFileType = "video" | "image" | "document" | "design"

export type FileVersion = {
  id: string
  label: string
  uploadedBy: string
  uploadedAt: string
  isCurrent: boolean
}

export type WorkspaceFile = {
  id: string
  name: string
  type: WorkspaceFileType
  currentVersion: string
  updatedAt: string
  updatedAtEpoch: number
  sizeLabel: string
  sizeBytes: number
  versions: FileVersion[]
}

export type ProjectFileSection = {
  id: string
  title: string
  files: WorkspaceFile[]
}

export type ShareType = "Dynamic Share" | "Snapshot Share"

export type ProjectShare = {
  id: string
  name: string
  type: ShareType
  createdAt: string
  expiresAt: string
  passwordProtected: boolean
  viewCount: number
  downloadCount: number
}

export type ActivityType = "upload" | "view" | "snapshot" | "restore"

export type ProjectActivity = {
  id: string
  type: ActivityType
  message: string
  createdAt: string
}

export type PaginationMeta = {
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
}

export type PaginatedProjects = {
  projects: Project[]
  meta: PaginationMeta
}
