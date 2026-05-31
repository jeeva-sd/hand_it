export const POST_LOGIN_PATH = "/post-login"
const LOGIN_PATH = "/auth/login"
const BLOCKED_CONTINUE_PREFIXES = ["/auth", POST_LOGIN_PATH]
const AUTH_CONTINUE_STORAGE_KEY = "handit.auth.continue"

function isBlockedContinuePath(path: string): boolean {
  return BLOCKED_CONTINUE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

export function normalizeContinuePath(path: string | null | undefined): string | null {
  const value = path?.trim()

  if (!value || !value.startsWith("/") || value.startsWith("//") || isBlockedContinuePath(value)) {
    return null
  }

  return value
}

export function buildPostLoginPath(path: string | null | undefined): string {
  const continuePath = normalizeContinuePath(path)

  if (!continuePath) {
    return POST_LOGIN_PATH
  }

  const searchParams = new URLSearchParams({ continue: continuePath })

  return `${POST_LOGIN_PATH}?${searchParams.toString()}`
}

export function buildLoginPath(path: string | null | undefined): string {
  const continuePath = normalizeContinuePath(path)

  if (!continuePath) {
    return LOGIN_PATH
  }

  const searchParams = new URLSearchParams({ continue: continuePath })

  return `${LOGIN_PATH}?${searchParams.toString()}`
}

export function getLocationTarget(pathname: string, search: string, hash: string): string {
  return `${pathname}${search}${hash}`
}

export function storeContinuePath(path: string | null | undefined): void {
  const continuePath = normalizeContinuePath(path)

  if (!continuePath) {
    return
  }

  window.sessionStorage.setItem(AUTH_CONTINUE_STORAGE_KEY, continuePath)
}

export function readStoredContinuePath(): string | null {
  const value = window.sessionStorage.getItem(AUTH_CONTINUE_STORAGE_KEY)

  return normalizeContinuePath(value)
}

export function clearStoredContinuePath(): void {
  window.sessionStorage.removeItem(AUTH_CONTINUE_STORAGE_KEY)
}
