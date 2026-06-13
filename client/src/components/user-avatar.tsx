import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { appConfig } from "@/config"

interface UserAvatarProps {
  userId: string | null | undefined
  fname: string
  lname: string
  className?: string
}

export function UserAvatar({ userId, fname, lname, className }: UserAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const initials = `${fname.slice(0, 1)}${lname.slice(0, 1)}`.toUpperCase() || "US"
  const avatarUrl = userId ? `${appConfig.api.url}/auth/profile-image/${userId}` : ""

  return (
    <Avatar className={className}>
      {!imgFailed && avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${fname} ${lname}`}
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : null}
      {(imgFailed || !avatarUrl) && (
        <AvatarFallback className="bg-secondary text-xs">{initials}</AvatarFallback>
      )}
    </Avatar>
  )
}
