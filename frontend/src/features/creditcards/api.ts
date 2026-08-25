import { apiRequest } from '../../lib/apiClient'

export interface CreditCard {
  id: string
  name: string
  brand: string | null
  creditLimit: number | null
  closingDay: number
  dueDay: number
  invoiceAmount: number | null
}

export interface CreateCreditCardInput {
  name: string
  brand: string | null
  creditLimit: number | null
  closingDay: number
  dueDay: number
}

export function listCreditCards(month?: string) {
  return apiRequest<CreditCard[]>(month ? `/credit-cards?month=${month}` : '/credit-cards')
}

export function createCreditCard(payload: CreateCreditCardInput) {
  return apiRequest<CreditCard>('/credit-cards', { method: 'POST', body: payload })
}

export function deleteCreditCard(id: string) {
  return apiRequest<void>(`/credit-cards/${id}`, { method: 'DELETE' })
}
