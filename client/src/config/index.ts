import * as yup from "yup"

import { baseConfig, type AppConfig, type AppConfigOverride } from "./base"
import { developmentConfig } from "./development"
import { prodectionConfig } from "./prodection"

function isSupportedApiBaseUrl(value: string): boolean {
  if (value.startsWith("/")) {
    return true
  }

  try {
    const parsed = new URL(value)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function mergeConfig(base: AppConfig, override: AppConfigOverride): AppConfig {
  return {
    ...base,
    ...override,
    app: {
      ...base.app,
      ...override.app,
    },
    api: {
      ...base.api,
      ...override.api,
    },
    auth: {
      ...base.auth,
      ...override.auth,
    },
  }
}

const configSchema = yup
  .object({
    app: yup
      .object({
        name: yup.string().required().defined(),
        env: yup.string().required().defined(),
      })
      .required()
      .defined(),
    api: yup
      .object({
        url: yup
          .string()
          .trim()
          .required()
          .defined()
          .test("api-base-url", "api.url must be a valid URL", (value) => {
            if (!value) {
              return false
            }

            return isSupportedApiBaseUrl(value)
          }),
        timeoutMs: yup.number().integer().min(1000).required().defined(),
        withCredentials: yup.boolean().required().defined(),
      })
      .required()
      .defined(),
    auth: yup
      .object({
        meQueryStaleTimeMs: yup.number().integer().min(0).required().defined(),
        googleSignInUrl: yup
          .string()
          .trim()
          .required()
          .defined()
          .test("google-sign-in-url", "auth.googleSignInUrl must be a valid URL", (value) => {
            if (!value) {
              return false
            }

            return isSupportedApiBaseUrl(value)
          }),
      })
      .required()
      .defined(),
  })
  .required()
  .defined()

const mode = import.meta.env.MODE === "production" ? "production" : "development"
const envConfig = mode === "production" ? prodectionConfig : developmentConfig
const mergedConfig = mergeConfig(baseConfig, envConfig)

export const appConfig = configSchema.validateSync(mergedConfig, {
  abortEarly: false,
  strict: true,
}) as AppConfig

export type { AppConfig }
