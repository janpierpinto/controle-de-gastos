import { apiRequest } from '../../lib/apiClient'

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'CHILD'

export interface Member {
  id: string
  name: string
  email: string
  role: MemberRole
}

export interface Invitation {
  id: string
  email: string
  role: MemberRole
  token: string
  expiresAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tenantId: string
  role: string
}

export function listMembers() {
  return apiRequest<Member[]>('/family/members')
}

export function listInvitations() {
  return apiRequest<Invitation[]>('/family/invitations')
}

export function createInvitation(email: string, role: MemberRole) {
  return apiRequest<Invitation>('/family/invitations', { method: 'POST', body: { email, role } })
}

export function removeMember(id: string) {
  return apiRequest<void>(`/family/members/${id}`, { method: 'DELETE' })
}

export function acceptInvitation(token: string, name: string, password: string) {
  return apiRequest<AuthResponse>('/family/invitations/accept', {
    method: 'POST',
    body: { token, name, password },
    auth: false,
  })
}
