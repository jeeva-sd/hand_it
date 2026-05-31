export type AuthUser = {
  id: string
  fname: string
  lname: string
  email: string
  status: number | null
  createdAt: string
  updatedAt: string
}

export type LastUsedWorkspace = {
  id: string
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
