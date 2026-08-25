import { apiRequest } from '../../lib/apiClient'

export interface Bill {
  id: string
  description: string
  amount: number
  dueDate: string
  status: 'PENDING' | 'PAID'
  recurring: boolean
  reminderDaysBefore: number
  overdue: boolean
}

export interface CreateBillInput {
  description: string
  amount: number
  dueDate: string
  recurring: boolean
  reminderDaysBefore: number
}

export function listBills() {
  return apiRequest<Bill[]>('/bills')
}

export function createBill(payload: CreateBillInput) {
  return apiRequest<Bill>('/bills', { method: 'POST', body: payload })
}

export function markBillPaid(id: string) {
  return apiRequest<Bill>(`/bills/${id}/pagar`, { method: 'PUT' })
}

export function deleteBill(id: string) {
  return apiRequest<void>(`/bills/${id}`, { method: 'DELETE' })
}
