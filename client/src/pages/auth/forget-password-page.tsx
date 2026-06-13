import { useMutation } from "@tanstack/react-query"
import { Loader2Icon } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { requestPasswordReset } from "@/services/auth.service"
import { ApiError } from "@/services/http.service"

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export function ForgetPasswordPage() {
  const [email, setEmail] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const forgetMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: (result) => {
      setSuccessMessage(result.message)
      setFormError(null)
    },
    onError: (error) => {
      setSuccessMessage(null)
      setFormError(resolveErrorMessage(error, "Unable to process your request. Please try again."))
    },
  })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setSuccessMessage(null)

    forgetMutation.mutate({ email: email.trim() })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Forgot password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and we will send a secure reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            required
          />
        </div>

        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
        )}

        {successMessage && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        <Button type="submit" className="h-10 w-full" disabled={forgetMutation.isPending}>
          {forgetMutation.isPending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2Icon className="size-4 animate-spin" />
              Sending link...
            </span>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Remembered your password?{" "}
        <Link to="/auth/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
