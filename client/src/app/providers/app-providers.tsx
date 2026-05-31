import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"

import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthSessionBootstrap } from "@/features/auth/auth-session-bootstrap"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

type AppProvidersProps = {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionBootstrap />
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  )
}
