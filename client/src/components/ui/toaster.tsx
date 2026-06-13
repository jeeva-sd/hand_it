import React from "react"
import { useToastStore, type ToastType } from "@/stores/toast.store"
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"

const icons: Record<ToastType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const styles: Record<ToastType, string> = {
  success: "bg-emerald-50/90 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800",
  error: "bg-rose-50/90 dark:bg-rose-950/90 text-rose-900 dark:text-rose-100 border-rose-200 dark:border-rose-800",
  info: "bg-slate-50/90 dark:bg-slate-950/90 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800",
  warning: "bg-amber-50/90 dark:bg-amber-950/90 text-amber-900 dark:text-amber-100 border-amber-200 dark:border-amber-800",
}

export function Toaster() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-md pointer-events-none">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || Info
        return (
          <div
            key={toast.id}
            className={cn(
              "flex items-start gap-3 p-4 rounded-md border shadow-lg backdrop-blur-md transition-all duration-300 pointer-events-auto",
              "animate-in slide-in-from-right-5 fade-in duration-200",
              styles[toast.type]
            )}
            role="alert"
          >
            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm font-medium leading-relaxed">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-current opacity-60 hover:opacity-100 transition-opacity rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
