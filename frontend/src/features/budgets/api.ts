import { apiRequest } from '../../lib/apiClient'

export interface Budget {
  id: string
  categoryId: string
  monthReference: string
  plannedAmount: number
  alertThresholdPct: number
  spentAmount: number
  percentageUsed: number
  alertTriggered: boolean
  exceeded: boolean
}

export interface CreateBudgetInput {
  categoryId: string
  monthReference: string
  plannedAmount: number
  alertThresholdPct: number
}

export function listBudgets(month: string) {
  return apiRequest<Budget[]>(`/budgets?month=${month}`)
}

export function createBudget(payload: CreateBudgetInput) {
  return apiRequest<Budget>('/budgets', { method: 'POST', body: payload })
}

export function deleteBudget(id: string) {
  return apiRequest<void>(`/budgets/${id}`, { method: 'DELETE' })
}
