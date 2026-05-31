import { Loader2Icon } from "lucide-react"

type RouteLoadingScreenProps = {
  message: string
}

export function RouteLoadingScreen({ message }: RouteLoadingScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        {message}
      </div>
    </div>
  )
}