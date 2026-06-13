import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { appConfig } from "@/config"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth.store"

interface UserAvatarProps {
  userId: string | null | undefined
  fname: string
  lname: string
  className?: string
  fallbackClassName?: string
}

export function UserAvatar({
  userId,
  fname,
  lname,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const authUser = useAuthStore((state) => state.user)
  const initials = `${fname.slice(0, 1)}${lname.slice(0, 1)}`.toUpperCase() || "US"
  
  const isCurrentUser = userId && authUser && userId === authUser.id
  const cacheBuster = isCurrentUser && authUser.updatedAt ? `?v=${encodeURIComponent(authUser.updatedAt)}` : ""
  const avatarUrl = userId ? `${appConfig.api.url}/auth/profile-image/${userId}${cacheBuster}` : ""

  useEffect(() => {
    setImgFailed(false)
  }, [avatarUrl])

  return (
    <Avatar className={className}>
      {!imgFailed && avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${fname} ${lname}`}
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover rounded-[inherit]"
        />
      ) : null}
      {(imgFailed || !avatarUrl) && (
        <AvatarFallback className={cn("bg-secondary text-xs", fallbackClassName)}>
          {initials}
        </AvatarFallback>
      )}
    </Avatar>
  )
}

