import { useMutation } from "@tanstack/react-query";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getGoogleSignInUrl, loginWithPassword } from "@/services/auth.service";
import { ApiError } from "@/services/http.service";
import { useAuthStore } from "@/stores/auth.store";

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

const MIN_PASSWORD_LENGTH = 8;

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuthenticatedSession = useAuthStore((state) => state.setAuthenticatedSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: loginWithPassword,
    onSuccess: (result) => {
      setAuthenticatedSession({
        user: result.user,
        lastUsedWorkspace: result.lastUsedWorkspace,
      });

      const cont = searchParams.get("continue");
      if (cont && cont.startsWith("/")) {
        navigate(cont, { replace: true });
      } else {
        const workspaceId = result.lastUsedWorkspace?.id || "default";
        navigate(`/w/${workspaceId}/projects`, { replace: true });
      }
    },
    onError: (error) => {
      setFormError(resolveErrorMessage(error, "Unable to sign in. Please try again."));
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setFormError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }

    loginMutation.mutate({
      email: email.trim(),
      password,
    });
  };

  const handleGoogleSignIn = () => {
    const cont = searchParams.get("continue");
    if (cont) {
      window.sessionStorage.setItem("handit.auth.continue", cont);
    }
    window.location.assign(getGoogleSignInUrl());
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Sign in</h2>
        <p className="mt-1 text-sm text-muted-foreground">Access your workspace and continue where you left off.</p>
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
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <Link to="/auth/forget-password" className="text-sm font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="pr-11"
              required
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </button>
          </div>
        </div>

        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </div>
        )}

        <Button type="submit" className="h-10 w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2Icon className="size-4 animate-spin" />
              Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <div className="text-center text-sm">
        <p className="text-muted-foreground">
          New here?{" "}
          <Link to="/auth/signup" className="font-medium text-primary hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
