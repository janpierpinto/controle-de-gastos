import { useAuthStore } from '../stores/authStore'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  auth?: boolean
}

async function parseErrorDetail(response: Response): Promise<string> {
  try {
    const problem = (await response.json()) as { detail?: string; title?: string }
    return problem.detail ?? problem.title ?? response.statusText
  } catch {
    return response.statusText
  }
}

// Access tokens are short-lived (15 min) — this lets a still-open tab
// silently pick up a new one via the refresh token instead of every request
// failing once the token expires. Shared across concurrent 401s so a page
// that fires several queries at once (e.g. the dashboard) only refreshes once.
let refreshPromise: Promise<boolean> | null = null

async function refreshSession(): Promise<boolean> {
  const { refreshToken, setSession } = useAuthStore.getState()
  if (!refreshToken) return false

  try {
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!response.ok) return false

    const data = (await response.json()) as {
      accessToken?: string | null
      refreshToken?: string | null
      tenantId?: string | null
      role?: string | null
    }
    if (!data.accessToken || !data.refreshToken || !data.tenantId || !data.role) return false

    setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, tenantId: data.tenantId, role: data.role })
    return true
  } catch {
    return false
  }
}

/** Clearing the session flips isAuthenticated to false, which ProtectedRoute (app/ProtectedRoute.tsx) already reacts to with a client-side redirect — no hard reload needed. */
export function redirectToLogin() {
  useAuthStore.getState().clearSession()
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options

  const doFetch = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (auth) {
      const token = useAuthStore.getState().accessToken
      if (token) headers.Authorization = `Bearer ${token}`
    }
    return fetch(`/api/v1${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  }

  let response = await doFetch()

  if (response.status === 401 && auth) {
    refreshPromise ??= refreshSession().finally(() => {
      refreshPromise = null
    })
    if (await refreshPromise) {
      response = await doFetch()
    }
  }

  if (!response.ok) {
    if (response.status === 401 && auth) {
      redirectToLogin()
    }
    throw new ApiError(response.status, await parseErrorDetail(response))
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
