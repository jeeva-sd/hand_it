import { useState, useRef, type ChangeEvent, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/auth.store"
import { updateProfile, uploadProfileImage } from "@/services/auth.service"
import { UserAvatar } from "@/components/user-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/services/http.service"
import {
  BellIcon,
  ChevronDownIcon,
  CircleUserRoundIcon,
  CommandIcon,
  LogOutIcon,
  MoonStarIcon,
  CameraIcon,
  Loader2Icon,
} from "lucide-react"

export function NavUser({
  user,
  onSignOut,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
  onSignOut: () => void
}) {
  const { isMobile } = useSidebar()
  const queryClient = useQueryClient()
  const authUser = useAuthStore((state) => state.user)
  const updateUserInStore = useAuthStore((state) => state.updateUser)

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [fname, setFname] = useState(authUser?.fname ?? "")
  const [lname, setLname] = useState(authUser?.lname ?? "")
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync state with store on open
  const handleOpenProfile = () => {
    if (authUser) {
      setFname(authUser.fname)
      setLname(authUser.lname)
    }
    setErrorMsg("")
    setSuccessMsg("")
    setIsProfileOpen(true)
  }

  // Details Mutation
  const updateDetailsMutation = useMutation({
    mutationFn: (payload: { fname: string; lname: string }) => updateProfile(payload),
    onSuccess: async (updatedUser) => {
      updateUserInStore(updatedUser)
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
      setSuccessMsg("Profile details updated successfully.")
      setErrorMsg("")
    },
    onError: (err) => {
      setSuccessMsg("")
      setErrorMsg(err instanceof ApiError ? err.message : "Failed to update profile details.")
    }
  })

  // Profile Image Mutation
  const uploadImageMutation = useMutation({
    mutationFn: (payload: FormData) => uploadProfileImage(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
      setSuccessMsg("Profile picture uploaded successfully.")
      setErrorMsg("")
    },
    onError: (err) => {
      setSuccessMsg("")
      setErrorMsg(err instanceof ApiError ? err.message : "Failed to upload profile picture.")
    }
  })

  const handleSaveDetails = (e: FormEvent) => {
    e.preventDefault()
    if (!fname.trim() || !lname.trim()) {
      setErrorMsg("First name and last name are required.")
      return
    }
    updateDetailsMutation.mutate({ fname: fname.trim(), lname: lname.trim() })
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 1 * 1024 * 1024) {
      setErrorMsg("File size must be less than 1MB.")
      return
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setErrorMsg("Only JPG and PNG formats are supported.")
      return
    }

    const formData = new FormData()
    formData.append("profileImage", file)
    uploadImageMutation.mutate(formData)
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="h-10 rounded-xl data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <UserAvatar
                  userId={authUser?.id}
                  fname={authUser?.fname || "HandIt"}
                  lname={authUser?.lname || "User"}
                  className="h-8 w-8 rounded-lg"
                  fallbackClassName="rounded-lg"
                />
                <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">{user.name}</span>
                <ChevronDownIcon className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="min-w-56 rounded-xl border border-border p-1.5"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={8}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm">
                  <UserAvatar
                    userId={authUser?.id}
                    fname={authUser?.fname || "HandIt"}
                    lname={authUser?.lname || "User"}
                    className="h-8 w-8 rounded-lg"
                    fallbackClassName="rounded-lg"
                  />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={(e) => {
                  e.preventDefault()
                  handleOpenProfile()
                }}>
                  <CircleUserRoundIcon />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BellIcon />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MoonStarIcon />
                  Theme
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CommandIcon />
                  Keyboard Shortcuts
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={onSignOut}>
                <LogOutIcon />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <SheetContent className="sm:max-w-md p-6 overflow-y-auto" side="right">
          <SheetHeader className="pb-6 border-b border-border">
            <SheetTitle className="text-xl font-bold tracking-tight">Profile Settings</SheetTitle>
            <SheetDescription className="text-muted-foreground">
              Manage your personal information, profile picture, and display details.
            </SheetDescription>
          </SheetHeader>

          {/* Profile Picture Upload Section */}
          <div className="flex flex-col items-center gap-4 py-8 bg-muted/20 rounded-2xl border border-dashed border-border/80 mt-6">
            <div className="relative group cursor-pointer" onClick={triggerFileSelect}>
              <UserAvatar
                userId={authUser?.id}
                fname={authUser?.fname || "HandIt"}
                lname={authUser?.lname || "User"}
                className="h-20 w-20 rounded-full border-2 border-border shadow-inner transition-transform duration-300 group-hover:scale-105"
                fallbackClassName="text-xl font-semibold bg-primary/10 text-primary"
              />
              <div className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <CameraIcon className="size-6 text-white" />
              </div>
              {uploadImageMutation.isPending && (
                <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                  <Loader2Icon className="size-6 animate-spin text-primary" />
                </div>
              )}
            </div>

            <div className="text-center">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={triggerFileSelect}
                  disabled={uploadImageMutation.isPending}
                  className="rounded-lg h-8"
                >
                  Change picture
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                Supported formats: JPG, PNG. Max file size: 1MB.
              </p>
            </div>
          </div>

          {/* Profile Details Form */}
          <form onSubmit={handleSaveDetails} className="space-y-5 mt-6">
            <div className="space-y-1.5">
              <label htmlFor="fname" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                First Name
              </label>
              <Input
                id="fname"
                value={fname}
                onChange={(e) => setFname(e.target.value)}
                placeholder="First name"
                required
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="lname" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Last Name
              </label>
              <Input
                id="lname"
                value={lname}
                onChange={(e) => setLname(e.target.value)}
                placeholder="Last name"
                required
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email Address
              </label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="h-10 rounded-xl bg-muted/60 border-border/80 cursor-not-allowed text-muted-foreground"
              />
              <p className="text-[11px] text-muted-foreground">
                Email address cannot be changed.
              </p>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200/80 p-2.5 rounded-xl font-medium animate-in fade-in-0 duration-200">
                {errorMsg}
              </p>
            )}

            {successMsg && (
              <p className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/80 p-2.5 rounded-xl font-medium animate-in fade-in-0 duration-200">
                {successMsg}
              </p>
            )}

            <Button
              type="submit"
              disabled={updateDetailsMutation.isPending || uploadImageMutation.isPending}
              className="w-full rounded-xl h-10 mt-2 font-medium"
            >
              {updateDetailsMutation.isPending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin mr-2" />
                  Saving changes...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
