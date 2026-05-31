import type { AppConfigOverride } from "./base"

export const prodectionConfig: AppConfigOverride = {
  app: {
    env: "production",
  },
  api: {
    url: import.meta.env.VITE_API_URL ?? "https://api.handit.app/api/v1",
  },
  auth: {
    googleSignInUrl: import.meta.env.VITE_GOOGLE_SIGNIN_URL ?? "https://api.handit.app/api/v1/auth/google",
  },
}
