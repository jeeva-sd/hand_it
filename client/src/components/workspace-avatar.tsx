import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface WorkspaceAvatarProps {
  name: string
  logoUrl?: string | null
  updatedAt?: string | null
  className?: string
  fallbackClassName?: string
}

export function WorkspaceAvatar({
  name,
  logoUrl,
  updatedAt,
  className,
  fallbackClassName,
}: WorkspaceAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const initials = name.slice(0, 2).toUpperCase() || "WS"
  
  const cacheBuster = updatedAt ? `?v=${encodeURIComponent(updatedAt)}` : ""
  const fullLogoUrl = logoUrl ? `${logoUrl}${cacheBuster}` : ""

  useEffect(() => {
    setImgFailed(false)
  }, [fullLogoUrl])

  return (
    <Avatar className={cn("rounded-lg", className)}>
      {!imgFailed && fullLogoUrl ? (
        <img
          src={fullLogoUrl}
          alt={name}
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover rounded-[inherit]"
        />
      ) : null}
      {(imgFailed || !fullLogoUrl) && (
        <AvatarFallback className={cn("bg-primary text-primary-foreground font-semibold text-xs rounded-[inherit]", fallbackClassName)}>
          {initials}
        </AvatarFallback>
      )}
    </Avatar>
  )
}
