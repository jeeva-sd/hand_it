import type { AppConfigOverride } from "./base"

export const developmentConfig: AppConfigOverride = {
  app: {
    env: "development",
  },
  api: {
    url: import.meta.env.VITE_API_URL ?? "http://localhost:5100/api/v1",
  },
  auth: {
    googleSignInUrl: import.meta.env.VITE_GOOGLE_SIGNIN_URL ?? "http://localhost:5100/api/v1/auth/google",
  },
}
