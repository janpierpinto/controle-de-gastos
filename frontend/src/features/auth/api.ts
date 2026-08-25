import { apiRequest } from '../../lib/apiClient'

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tenantId: string
  role: string
}

export interface RegisterPayload {
  tenantName: string
  email: string
  password: string
  name: string
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
