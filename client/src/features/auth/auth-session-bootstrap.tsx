import { useAuthSessionQuery } from "@/features/auth/use-auth-session-query"

export function AuthSessionBootstrap() {
  useAuthSessionQuery()
  return null
}
