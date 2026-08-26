import { apiRequest } from '../../lib/apiClient'

export interface TwoFactorStatus {
  enabled: boolean
}

export interface TwoFactorSetup {
  secret: string
  qrCodeDataUri: string
}

export function getTwoFactorStatus() {
  return apiRequest<TwoFactorStatus>('/auth/2fa/status')
}

export function setupTwoFactor() {
  return apiRequest<TwoFactorSetup>('/auth/2fa/setup', { method: 'POST' })
}

export function enableTwoFactor(code: string) {
  return apiRequest<void>('/auth/2fa/enable', { method: 'POST', body: { code } })
}

export function disableTwoFactor(password: string) {
  return apiRequest<void>('/auth/2fa/disable', { method: 'POST', body: { password } })
}
