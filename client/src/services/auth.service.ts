import type {
  AuthMeResponse,
  ForgetPasswordRequest,
  ForgetPasswordResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  SignupRequest,
  SignupResponse,
} from "@/types/auth"
import { appConfig } from "@/config"

import { apiRequest } from "./http.service"

export function loginWithPassword(payload: LoginRequest) {
  return apiRequest<LoginResponse, LoginRequest>("/auth/login", {
    method: "POST",
    body: payload,
  })
}

export function signupWithEmail(payload: SignupRequest) {
  return apiRequest<SignupResponse, SignupRequest>("/auth/signup", {
    method: "POST",
    body: payload,
  })
}

export function requestPasswordReset(payload: ForgetPasswordRequest) {
  return apiRequest<ForgetPasswordResponse, ForgetPasswordRequest>("/auth/forget", {
    method: "POST",
    body: payload,
  })
}

export function fetchAuthMe() {
  return apiRequest<AuthMeResponse>("/auth/me", {
    method: "GET",
  })
}

export function logoutSession() {
  return apiRequest<LogoutResponse>("/auth/logout", {
    method: "POST",
  })
}

export function getGoogleSignInUrl() {
  return appConfig.auth.googleSignInUrl
}
