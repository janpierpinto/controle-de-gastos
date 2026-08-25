import { apiRequest } from '../../lib/apiClient'

export interface MonthlyForecast {
  month: string
  projectedIncome: number
  projectedExpense: number
  knownBillsTotal: number
  projectedNet: number
}

export function listForecast(months = 3) {
  return apiRequest<MonthlyForecast[]>(`/forecast?months=${months}`)
}
