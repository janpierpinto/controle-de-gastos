import { apiRequest } from '../../lib/apiClient'

export function getVapidPublicKey() {
  return apiRequest<{ publicKey: string }>('/notifications/vapid-public-key', { auth: false })
}

export function registerSubscription(endpoint: string, p256dh: string, auth: string) {
  return apiRequest<void>('/notifications/subscriptions', { method: 'POST', body: { endpoint, p256dh, auth } })
}

export function unregisterSubscription(endpoint: string) {
  return apiRequest<void>(`/notifications/subscriptions?endpoint=${encodeURIComponent(endpoint)}`, { method: 'DELETE' })
}

export function sendTestNotification() {
  return apiRequest<{ sent: number }>('/notifications/test', { method: 'POST' })
}
