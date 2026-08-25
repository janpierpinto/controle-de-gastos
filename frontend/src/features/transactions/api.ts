import { apiRequest } from '../../lib/apiClient'
import type { CategoryType } from '../categories/api'

export interface Transaction {
  id: string
  categoryId: string | null
  description: string
  amount: number
  occurredOn: string
  type: CategoryType
  origin: 'MANUAL' | 'OPEN_FINANCE'
  recurring: boolean
  notes: string | null
}

interface PagedResponse<T> {
  content: T[]
  page: { size: number; number: number; totalElements: number; totalPages: number }
}

export interface TransactionInput {
  categoryId: string | null
  description: string
  amount: number
  occurredOn: string
  type: CategoryType
  recurring: boolean
  notes: string | null
}

export function listTransactions() {
  return apiRequest<PagedResponse<Transaction>>('/transactions?size=50')
}

export function createTransaction(payload: TransactionInput) {
  return apiRequest<Transaction>('/transactions', { method: 'POST', body: payload })
}

export function updateTransaction(id: string, payload: TransactionInput) {
  return apiRequest<Transaction>(`/transactions/${id}`, { method: 'PUT', body: payload })
}

export function deleteTransaction(id: string) {
  return apiRequest<void>(`/transactions/${id}`, { method: 'DELETE' })
}
