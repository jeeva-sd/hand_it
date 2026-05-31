import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"

import { appConfig } from "@/config"
import { fetchAuthMe } from "@/services/auth.service"
import { ApiError } from "@/services/http.service"
import { useAuthStore } from "@/stores/auth.store"

export function useAuthSessionQuery() {
  const setSessionFromMe = useAuthStore((state) => state.setSessionFromMe)
  const markUnauthenticated = useAuthStore((state) => state.markUnauthenticated)

  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchAuthMe,
    retry: false,
    staleTime: appConfig.auth.meQueryStaleTimeMs,
  })

  useEffect(() => {
    if (!query.data) {
      return
    }

    setSessionFromMe(query.data)
  }, [query.data, setSessionFromMe])

  useEffect(() => {
    if (!query.error) {
      return
    }

    if (query.error instanceof ApiError && (query.error.status === 401 || query.error.status === 403)) {
      markUnauthenticated()
      return
    }

    markUnauthenticated()
  }, [query.error, markUnauthenticated])

  return query
}
