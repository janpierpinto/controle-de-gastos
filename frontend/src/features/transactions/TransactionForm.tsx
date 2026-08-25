import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { listCategories } from '../categories/api'
import { createTransaction } from './api'

const schema = z.object({
  description: z.string().min(1, 'obrigatório'),
  amount: z
    .string()
    .min(1, 'obrigatório')
    .refine((value) => Number(value) > 0, 'deve ser positivo'),
  occurredOn: z.string().min(1, 'obrigatório'),
  type: z.enum(['EXPENSE', 'INCOME']),
  categoryId: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const todayIso = () => new Date().toISOString().slice(0, 10)

export function TransactionForm() {
  const queryClient = useQueryClient()
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: listCategories })

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'EXPENSE', occurredOn: todayIso(), amount: '', description: '' },
  })

  const selectedType = watch('type')

  const mutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      reset({ description: '', amount: '', occurredOn: todayIso(), type: selectedType, categoryId: undefined })
    },
  })

  const visibleCategories = categories?.filter((category) => category.type === selectedType) ?? []

  return (
    <form
      onSubmit={handleSubmit((values) =>
        mutation.mutate({
          description: values.description,
          amount: Number(values.amount),
          occurredOn: values.occurredOn,
          type: values.type,
          categoryId: values.categoryId || null,
          recurring: false,
          notes: null,
        }),
      )}
      className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-2 dark:border-slate-800"
    >
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium">Descrição</label>
        <input
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          {...register('description')}
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Tipo</label>
        <select
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          {...register('type')}
        >
          <option value="EXPENSE">Gasto</option>
          <option value="INCOME">Receita</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Categoria</label>
        <select
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          {...register('categoryId')}
        >
          <option value="">Sem categoria</option>
          {visibleCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Valor (R$)</label>
        <input
          type="number"
          step="0.01"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          {...register('amount')}
        />
        {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Data</label>
        <input
          type="date"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          {...register('occurredOn')}
        />
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-slate-50 dark:text-slate-900"
        >
          {mutation.isPending ? 'Salvando…' : 'Adicionar transação'}
        </button>
      </div>
    </form>
  )
}
