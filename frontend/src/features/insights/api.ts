import { apiRequest } from '../../lib/apiClient'

export type InsightType = 'BUDGET_ALERT' | 'UPCOMING_BILL' | 'MONTH_COMPARISON' | 'RECURRING_DETECTED'
export type InsightSeverity = 'DANGER' | 'WARNING' | 'INFO' | 'SUCCESS'

export interface Insight {
  type: InsightType
  severity: InsightSeverity
  title: string
  description: string
}

export function listInsights() {
  return apiRequest<Insight[]>('/insights')
}
