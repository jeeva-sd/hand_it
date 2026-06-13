export type AuthUser = {
  id: string
  fname: string
  lname: string
  email: string
  avatarUrl: string | null
  status: string | null
  createdAt: string
  updatedAt: string
}

export type LastUsedWorkspace = {
  id: string
  name: string
  plan: "Free" | "Pro" | "Team"
  roleId: string | null
  accessId: string | null
}

export type AuthMeResponse = {
  user: AuthUser
  lastUsedWorkspace: LastUsedWorkspace | null
}

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  user: AuthUser
  lastUsedWorkspace: LastUsedWorkspace | null
  token?: string
}

export type SignupRequest = {
  fname: string
  lname: string
  email: string
}

export type SignupResponse = {
  message: string
}

export type ForgetPasswordRequest = {
  email: string
}

export type ForgetPasswordResponse = {
  message: string
}

export type LogoutResponse = {
  message: string
}
