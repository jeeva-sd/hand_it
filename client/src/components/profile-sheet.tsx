import { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/auth.store"
import { updateProfile, uploadProfileImage } from "@/services/auth.service"
import { UserAvatar } from "@/components/user-avatar"
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
import { CameraIcon, Loader2Icon } from "lucide-react"
import { toast } from "@/stores/toast.store"

interface ProfileSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileSheet({ open, onOpenChange }: ProfileSheetProps) {
  const queryClient = useQueryClient()
  const authUser = useAuthStore((state) => state.user)
  const updateUserInStore = useAuthStore((state) => state.updateUser)

  const [fname, setFname] = useState("")
  const [lname, setLname] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync state with store on open or authUser changes
  useEffect(() => {
    if (open && authUser) {
      setFname(authUser.fname)
      setLname(authUser.lname)
    }
  }, [open, authUser])

  // Details Mutation
  const updateDetailsMutation = useMutation({
    mutationFn: (payload: { fname: string; lname: string }) => updateProfile(payload),
    onSuccess: async (updatedUser) => {
      updateUserInStore(updatedUser)
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
      toast.success("Profile details updated successfully.")
      onOpenChange(false)
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to update profile details.")
    }
  })

  // Profile Image Mutation
  const uploadImageMutation = useMutation({
    mutationFn: (payload: FormData) => uploadProfileImage(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
      toast.success("Profile picture uploaded successfully.")
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to upload profile picture.")
    }
  })

  const handleSaveDetails = (e: FormEvent) => {
    e.preventDefault()
    if (!fname.trim() || !lname.trim()) {
      toast.error("First name and last name are required.")
      return
    }
    updateDetailsMutation.mutate({ fname: fname.trim(), lname: lname.trim() })
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 1 * 1024 * 1024) {
      toast.error("File size must be less than 1MB.")
      return
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Only JPG and PNG formats are supported.")
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md p-6 overflow-y-auto" side="right">
        <SheetHeader className="pb-6 border-b border-border">
          <SheetTitle className="text-xl font-bold tracking-tight">Profile Settings</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Manage your personal information, profile picture, and display details.
          </SheetDescription>
        </SheetHeader>

        {/* Profile Picture Upload Section */}
        <div className="flex flex-col items-center gap-4 py-8 bg-muted/20 rounded-lg border border-dashed border-border/80 mt-6">
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
                className="rounded-md h-8"
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
              className="h-10 rounded-md"
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
              className="h-10 rounded-md"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email Address
            </label>
            <Input
              id="email"
              value={authUser?.email ?? ""}
              disabled
              className="h-10 rounded-md bg-muted/60 border-border/80 cursor-not-allowed text-muted-foreground"
            />
            <p className="text-[11px] text-muted-foreground">
              Email address cannot be changed.
            </p>
          </div>
          <Button
            type="submit"
            disabled={updateDetailsMutation.isPending || uploadImageMutation.isPending}
            className="w-full rounded-md h-10 mt-2 font-medium"
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
  )
}
