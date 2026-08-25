import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { CurrencyInput } from '../../components/ui/CurrencyInput'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field } from '../../components/ui/Field'
import { inputClass } from '../../components/ui/formStyles'
import { PieChartIcon, PlusIcon, TrashIcon, XIcon } from '../../components/icons'
import { currentMonthStart } from '../../lib/date'
import { formatBRL } from '../../lib/currency'
import { CategorySelect } from '../categories/CategorySelect'
import { listCategories } from '../categories/api'
import { createBudget, deleteBudget, listBudgets } from './api'

const schema = z.object({
  categoryId: z.string().min(1, 'obrigatório'),
  plannedAmount: z.number().positive('informe um valor'),
})

type FormValues = z.infer<typeof schema>

export function BudgetsSection() {
  const month = currentMonthStart()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: listCategories })
  const { data: budgets, isLoading } = useQuery({ queryKey: ['budgets', month], queryFn: () => listBudgets(month) })

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { categoryId: '', plannedAmount: 0 } })

  const createMutation = useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', month] })
      reset({ categoryId: '', plannedAmount: 0 })
      setShowForm(false)
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
    <Card>
      <CardHeader
        icon={<PieChartIcon />}
        title="Orçamentos do mês"
        description="Defina limites por categoria e acompanhe o progresso"
        action={
          availableCategories.length > 0 && (
            <Button
              type="button"
              variant={showForm ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setShowForm((value) => !value)}
            >
              {showForm ? <XIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
              {showForm ? 'Cancelar' : 'Novo orçamento'}
            </Button>
          )
        }
      />

      <CardBody className="space-y-4">
        {showForm && (
          <form
            onSubmit={handleSubmit((values) =>
              createMutation.mutate({
                categoryId: values.categoryId,
                monthReference: month,
                plannedAmount: values.plannedAmount,
                alertThresholdPct: 80,
              }),
            )}
            className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end dark:border-slate-800 dark:bg-slate-950/50"
          >
            <Field label="Categoria" htmlFor="budget-category" error={errors.categoryId?.message}>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <CategorySelect
                    id="budget-category"
                    value={field.value}
                    onChange={field.onChange}
                    type="EXPENSE"
                    emptyLabel="Selecione"
                    excludeIds={Array.from(budgetedCategoryIds)}
                  />
                )}
              />
            </Field>
            <Field label="Valor planejado" htmlFor="budget-amount" error={errors.plannedAmount?.message} className="sm:w-44">
              <Controller
                name="plannedAmount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    id="budget-amount"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className={inputClass}
                    aria-invalid={!!errors.plannedAmount}
                  />
                )}
              />
            </Field>
            <Button type="submit" loading={createMutation.isPending}>
              Salvar
            </Button>
          </form>
        )}

        {isLoading && (
          <div className="space-y-2">
            {[0, 1].map((key) => (
              <div key={key} className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        )}

        {!isLoading && (!budgets || budgets.length === 0) && (
          <EmptyState
            icon={<PieChartIcon className="h-6 w-6" />}
            title="Nenhum orçamento definido"
            description="Defina um limite por categoria para receber alertas quando o gasto se aproximar do teto."
            action={
              !showForm &&
              availableCategories.length > 0 && (
                <Button size="sm" onClick={() => setShowForm(true)}>
                  <PlusIcon className="h-4 w-4" /> Novo orçamento
                </Button>
              )
            }
          />
        )}

        {budgets && budgets.length > 0 && (
          <ul className="space-y-3">
            {budgets.map((budget) => {
              const barColor = budget.exceeded ? 'bg-red-500' : budget.alertTriggered ? 'bg-amber-500' : 'bg-indigo-600'
              return (
                <li key={budget.id} className="group rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {categoryNameById.get(budget.categoryId) ?? 'Categoria'}
                    </span>
                    <div className="flex items-center gap-2">
                      {budget.exceeded && <Badge tone="danger">Estourado</Badge>}
                      {!budget.exceeded && budget.alertTriggered && <Badge tone="warning">Atenção</Badge>}
                      <button
                        onClick={() => deleteMutation.mutate(budget.id)}
                        className="rounded-lg p-1.5 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                        aria-label="Remover orçamento"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(budget.percentageUsed, 100)}%` }} />
                  </div>

                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    {formatBRL(budget.spentAmount)}{' '}
                    <span className="text-slate-400 dark:text-slate-500">de {formatBRL(budget.plannedAmount)}</span>{' '}
                    <span className="text-slate-400 dark:text-slate-500">({budget.percentageUsed}%)</span>
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
