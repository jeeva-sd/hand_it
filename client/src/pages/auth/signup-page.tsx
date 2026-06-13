import { useMutation } from "@tanstack/react-query"
import { Loader2Icon } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getGoogleSignInUrl, signupWithEmail } from "@/services/auth.service"
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

export function SignupPage() {
  const [fname, setFname] = useState("")
  const [lname, setLname] = useState("")
  const [email, setEmail] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const signupMutation = useMutation({
    mutationFn: signupWithEmail,
    onSuccess: (result) => {
      setSuccessMessage(result.message)
      setFormError(null)
    },
    onError: (error) => {
      setSuccessMessage(null)
      setFormError(resolveErrorMessage(error, "Unable to create account. Please try again."))
    },
  })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setSuccessMessage(null)

    signupMutation.mutate({
      fname: fname.trim(),
      lname: lname.trim(),
      email: email.trim(),
    })
  }

  const handleGoogleSignIn = () => {
    window.location.assign(getGoogleSignInUrl())
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Create account</h2>
        <p className="mt-1 text-sm text-muted-foreground">Get your HandIt workspace ready in a minute.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Button type="button" variant="outline" className="h-10 w-full" onClick={handleGoogleSignIn}>
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="fname" className="text-sm font-medium text-foreground">
              First name
            </label>
            <Input
              id="fname"
              type="text"
              value={fname}
              onChange={(event) => setFname(event.target.value)}
              placeholder="Alex"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="lname" className="text-sm font-medium text-foreground">
              Last name
            </label>
            <Input
              id="lname"
              type="text"
              value={lname}
              onChange={(event) => setLname(event.target.value)}
              placeholder="Johnson"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Work email
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

        <Button type="submit" className="h-10 w-full" disabled={signupMutation.isPending}>
          {signupMutation.isPending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2Icon className="size-4 animate-spin" />
              Creating account...
            </span>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/auth/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
