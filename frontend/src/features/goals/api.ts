import { apiRequest } from '../../lib/apiClient'

export interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string | null
  percentageComplete: number
  completed: boolean
}

export interface GoalInput {
  name: string
  targetAmount: number
  targetDate: string | null
}

export function listGoals() {
  return apiRequest<Goal[]>('/goals')
}

export function createGoal(payload: GoalInput) {
  return apiRequest<Goal>('/goals', { method: 'POST', body: payload })
}

export function contributeToGoal(id: string, amount: number) {
  return apiRequest<Goal>(`/goals/${id}/contributions`, { method: 'POST', body: { amount } })
}

export function deleteGoal(id: string) {
  return apiRequest<void>(`/goals/${id}`, { method: 'DELETE' })
}
