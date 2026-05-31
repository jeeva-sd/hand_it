import { appConfig } from "@/config"

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

type ApiRequestOptions<TBody> = {
  method?: HttpMethod
  body?: TBody
  token?: string | null
  signal?: AbortSignal
  headers?: Record<string, string>
}

export class ApiError extends Error {
  status: number
  details: unknown

  constructor(message: string, status: number, details: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.details = details
  }
}

function buildApiUrl(path: string): string {
  const baseUrl = appConfig.api.url.replace(/\/+$/, "")
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${baseUrl}${normalizedPath}`
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    return response.json()
  }

  const text = await response.text()
  return text.length > 0 ? text : null
}

function resolveErrorMessage(payload: unknown, fallbackMessage: string): string {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message: unknown }).message

    if (typeof message === "string" && message.length > 0) {
      return message
    }

    if (Array.isArray(message)) {
      return message.join(", ")
    }
  }

  if (typeof payload === "string" && payload.length > 0) {
    return payload
  }

  return fallbackMessage
}

export async function apiRequest<TResponse, TBody = unknown>(
  path: string,
  options: ApiRequestOptions<TBody> = {}
): Promise<TResponse> {
  const method = options.method ?? "GET"
  const controller = new AbortController()

  const timeout = window.setTimeout(() => {
    controller.abort()
  }, appConfig.api.timeoutMs)

  if (options.signal) {
    options.signal.addEventListener(
      "abort",
      () => {
        controller.abort()
      },
      { once: true }
    )
  }

  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  }

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json"
  }

  if (options.token && options.token.trim().length > 0) {
    headers.Authorization = `Bearer ${options.token.trim()}`
  }

  try {
    const response = await fetch(buildApiUrl(path), {
      method,
      headers,
      credentials: appConfig.api.withCredentials ? "include" : "same-origin",
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    })

    const payload = await parseResponseBody(response)

    if (!response.ok) {
      const fallbackMessage = `Request failed with status ${response.status}`
      const message = resolveErrorMessage(payload, fallbackMessage)
      throw new ApiError(message, response.status, payload)
    }

    return payload as TResponse
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request timed out. Please try again.", 408, null)
    }

    if (error instanceof ApiError) {
      throw error
    }

    const message = error instanceof Error ? error.message : "Unexpected network error"
    throw new ApiError(message, 0, null)
  } finally {
    window.clearTimeout(timeout)
  }
}
