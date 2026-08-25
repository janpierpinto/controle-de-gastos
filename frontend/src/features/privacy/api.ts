import { apiRequest } from '../../lib/apiClient'

export interface MyDataExport {
  id: string
  name: string
  email: string
  createdAt: string
  memberships: { tenantId: string; tenantName: string; role: string; joinedAt: string }[]
}

export interface AuditLogEntry {
  id: string
  action: string
  entity: string
  entityId: string | null
  actorUserId: string | null
  occurredAt: string
}

export function getMyData() {
  return apiRequest<MyDataExport>('/privacy/my-data')
}

export function deleteMyAccount() {
  return apiRequest<void>('/privacy/account', { method: 'DELETE' })
}

export function getAuditLog() {
  return apiRequest<AuditLogEntry[]>('/privacy/audit-log')
}
