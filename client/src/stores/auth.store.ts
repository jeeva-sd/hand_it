import { create } from "zustand"

import type { AuthMeResponse, AuthUser, LastUsedWorkspace } from "@/types/auth"

type AuthStatus = "unknown" | "authenticated" | "unauthenticated"

type AuthStore = {
  status: AuthStatus
  hasCheckedSession: boolean
  user: AuthUser | null
  lastUsedWorkspace: LastUsedWorkspace | null
  setAuthenticatedSession: (payload: {
    user: AuthUser
    lastUsedWorkspace: LastUsedWorkspace | null
  }) => void
  setSessionFromMe: (payload: AuthMeResponse) => void
  setLastUsedWorkspace: (lastUsedWorkspace: LastUsedWorkspace | null) => void
  updateUser: (user: AuthUser) => void
  markUnauthenticated: () => void
  clearSession: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  status: "unknown",
  hasCheckedSession: false,
  user: null,
  lastUsedWorkspace: null,
  setAuthenticatedSession: ({ user, lastUsedWorkspace }) => {
    set({
      status: "authenticated",
      hasCheckedSession: true,
      user,
      lastUsedWorkspace,
    })
  },
  setSessionFromMe: (payload) => {
    set({
      status: "authenticated",
      hasCheckedSession: true,
      user: payload.user,
      lastUsedWorkspace: payload.lastUsedWorkspace,
    })
  },
  setLastUsedWorkspace: (lastUsedWorkspace) => {
    set({
      lastUsedWorkspace,
    })
  },
  updateUser: (user) => {
    set({
      user,
    })
  },
  markUnauthenticated: () => {
    set({
      status: "unauthenticated",
      hasCheckedSession: true,
      user: null,
      lastUsedWorkspace: null,
    })
  },
  clearSession: () => {
    set({
      status: "unauthenticated",
      hasCheckedSession: true,
      user: null,
      lastUsedWorkspace: null,
    })
  },
}))
