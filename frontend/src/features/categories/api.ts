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

export interface CreateCategoryInput {
  name: string
  icon: string | null
  color: string | null
  type: CategoryType
}

export function listCategories() {
  return apiRequest<Category[]>('/categories')
}

export function createCategory(payload: CreateCategoryInput) {
  return apiRequest<Category>('/categories', { method: 'POST', body: payload })
}
