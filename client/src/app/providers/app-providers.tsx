import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"

import { TooltipProvider } from "@/components/ui/tooltip"

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
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  )
}
