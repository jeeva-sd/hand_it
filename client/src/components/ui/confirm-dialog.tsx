import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  variant?: "destructive" | "primary"
  isLoading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = "primary",
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-150 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 border bg-popover p-6 shadow-lg duration-200 ease-in-out rounded-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-1/2 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-1/2"
          )}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-4">
              {variant === "destructive" && (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertTriangle className="size-5" />
                </div>
              )}
              <div className="flex-1 space-y-1">
                <DialogPrimitive.Title className="text-base font-semibold text-foreground">
                  {title}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-sm text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close asChild>
                <button className="rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none cursor-pointer">
                  <X className="size-4" />
                  <span className="sr-only">Close</span>
                </button>
              </DialogPrimitive.Close>
            </div>
            
            <div className="flex justify-end gap-3 mt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="rounded-md cursor-pointer"
              >
                {cancelText}
              </Button>
              <Button
                variant={variant === "destructive" ? "destructive" : "default"}
                onClick={onConfirm}
                disabled={isLoading}
                className="rounded-md min-w-[80px] cursor-pointer"
              >
                {isLoading ? "Loading..." : confirmText}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
