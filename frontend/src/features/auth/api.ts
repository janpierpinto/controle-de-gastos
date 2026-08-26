import { apiRequest } from '../../lib/apiClient'

export interface Tokens {
  accessToken: string
  refreshToken: string
  tenantId: string
  role: string
}

export interface AuthResponse {
  accessToken: string | null
  refreshToken: string | null
  tenantId: string | null
  role: string | null
  mfaRequired: boolean
  mfaToken: string | null
}

export interface RegisterPayload {
  tenantName: string
  email: string
  password: string
  name: string
  acceptedTerms: boolean
}

export interface LoginPayload {
  email: string
  password: string
}

export function register(payload: RegisterPayload) {
  return apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: payload, auth: false })
}

export function login(payload: LoginPayload) {
  return apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: payload, auth: false })
}

export function verifyMfa(payload: { mfaToken: string; code: string }) {
  return apiRequest<AuthResponse>('/auth/2fa/verify', { method: 'POST', body: payload, auth: false })
}

/** Narrows an AuthResponse to real tokens — throws if the account requires an MFA step that hasn't happened yet. */
export function assertTokens(data: AuthResponse): Tokens {
  if (data.mfaRequired || !data.accessToken || !data.refreshToken || !data.tenantId || !data.role) {
    throw new Error('Resposta de autenticação inesperada')
  }
  return { accessToken: data.accessToken, refreshToken: data.refreshToken, tenantId: data.tenantId, role: data.role }
}
