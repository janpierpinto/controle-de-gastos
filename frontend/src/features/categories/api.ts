import { apiRequest } from '../../lib/apiClient'

export type CategoryType = 'EXPENSE' | 'INCOME'

export interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
  type: CategoryType
  global: boolean
}

export function listCategories() {
  return apiRequest<Category[]>('/categories')
}
