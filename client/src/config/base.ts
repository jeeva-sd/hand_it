export type AppConfig = {
  app: {
    name: string
    env: string
  }
  api: {
    url: string
    timeoutMs: number
    withCredentials: boolean
  }
  auth: {
    meQueryStaleTimeMs: number
    redirectAfterLogin: string
    googleSignInUrl: string
  }
}

export type AppConfigOverride = {
  app?: Partial<AppConfig["app"]>
  api?: Partial<AppConfig["api"]>
  auth?: Partial<AppConfig["auth"]>
}

export const baseConfig: AppConfig = {
  app: {
    name: "HandIt",
    env: "base",
  },
  api: {
    url: "http://localhost:5100/api/v1",
    timeoutMs: 15_000,
    withCredentials: true,
  },
  auth: {
    meQueryStaleTimeMs: 60_000,
    redirectAfterLogin: "/projects",
    googleSignInUrl: "http://localhost:5100/api/v1/auth/google",
  },
}
