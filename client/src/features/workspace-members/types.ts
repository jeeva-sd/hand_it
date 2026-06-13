export type AppRole = "Owner" | "Admin" | "Member"

export const roleHint: Record<AppRole, string> = {
  Owner: "Full access · billing · workspace settings",
  Admin: "Manage members, projects, files, shares, requests",
  Member: "Access assigned projects",
}

export const roleMapToBackend: Record<AppRole, "OWNER" | "ADMIN" | "MEMBER"> = {
  Owner: "OWNER",
  Admin: "ADMIN",
  Member: "MEMBER",
}

export const roleMapToFrontend: Record<string, AppRole> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Member",
}

export const statusMapToFrontend: Record<string, string> = {
  ACTIVE: "Active",
  INVITED: "Invited",
  DECLINED: "Declined",
  DELETED: "Deleted",
}
