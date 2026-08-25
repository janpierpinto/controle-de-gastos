import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { currentMonthStart } from '../../lib/date'
import { listCategories } from '../categories/api'
import { createBudget, deleteBudget, listBudgets } from './api'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const schema = z.object({
  categoryId: z.string().min(1, 'obrigatório'),
  plannedAmount: z
    .string()
    .min(1, 'obrigatório')
    .refine((value) => Number(value) > 0, 'deve ser positivo'),
})

type FormValues = z.infer<typeof schema>

export function BudgetsSection() {
  const month = currentMonthStart()
  const queryClient = useQueryClient()

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: listCategories })
  const { data: budgets, isLoading } = useQuery({ queryKey: ['budgets', month], queryFn: () => listBudgets(month) })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { categoryId: '', plannedAmount: '' } })

  const createMutation = useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', month] })
      reset({ categoryId: '', plannedAmount: '' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets', month] }),
  })

  const expenseCategories = categories?.filter((category) => category.type === 'EXPENSE') ?? []
  const categoryNameById = new Map((categories ?? []).map((category) => [category.id, category.name]))
  const budgetedCategoryIds = new Set((budgets ?? []).map((budget) => budget.categoryId))
  const availableCategories = expenseCategories.filter((category) => !budgetedCategoryIds.has(category.id))

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Orçamentos do mês</h2>

      {isLoading && <p className="text-sm text-slate-500">Carregando…</p>}

      {budgets && budgets.length > 0 && (
        <ul className="space-y-2">
          {budgets.map((budget) => {
            const barColor = budget.exceeded
              ? 'bg-red-600'
              : budget.alertTriggered
                ? 'bg-amber-500'
                : 'bg-green-600'
            return (
              <li key={budget.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{categoryNameById.get(budget.categoryId) ?? 'Categoria'}</span>
                  <div className="flex items-center gap-2">
                    <span>
                      {currency.format(budget.spentAmount)} / {currency.format(budget.plannedAmount)}
                    </span>
                    <button
                      onClick={() => deleteMutation.mutate(budget.id)}
                      className="text-xs text-slate-400 hover:text-red-600"
                      aria-label="Remover orçamento"
                    >
                      remover
                    </button>
                  </div>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded bg-slate-200 dark:bg-slate-800">
                  <div
                    className={`h-full ${barColor}`}
                    style={{ width: `${Math.min(budget.percentageUsed, 100)}%` }}
                  />
                </div>
                {budget.alertTriggered && (
                  <p className={`mt-1 text-xs ${budget.exceeded ? 'text-red-600' : 'text-amber-600'}`}>
                    {budget.exceeded ? 'Orçamento estourado' : `${budget.percentageUsed}% do orçamento usado`}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {availableCategories.length > 0 && (
        <form
          onSubmit={handleSubmit((values) =>
            createMutation.mutate({
              categoryId: values.categoryId,
              monthReference: month,
              plannedAmount: Number(values.plannedAmount),
              alertThresholdPct: 80,
            }),
          )}
          className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800"
        >
          <div>
            <label className="block text-xs font-medium">Categoria</label>
            <select
              className="mt-1 rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              {...register('categoryId')}
            >
              <option value="">Selecione</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium">Valor planejado (R$)</label>
            <input
              type="number"
              step="0.01"
              className="mt-1 w-32 rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              {...register('plannedAmount')}
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-slate-50 dark:text-slate-900"
          >
            Definir orçamento
          </button>
          {(errors.categoryId || errors.plannedAmount) && (
            <p className="w-full text-xs text-red-600">
              {errors.categoryId?.message ?? errors.plannedAmount?.message}
            </p>
          )}
        </form>
      )}
    </section>
  )
}
