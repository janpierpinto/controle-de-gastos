import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { CurrencyInput } from '../../components/ui/CurrencyInput'
import { Field } from '../../components/ui/Field'
import { inputClass, labelClass } from '../../components/ui/formStyles'
import { TrendingDownIcon, TrendingUpIcon } from '../../components/icons'
import { CategorySelect } from '../categories/CategorySelect'
import { listCreditCards } from '../creditcards/api'
import { createTransaction } from './api'

const schema = z.object({
  description: z.string().min(1, 'obrigatório'),
  amount: z.number().positive('informe um valor'),
  occurredOn: z.string().min(1, 'obrigatório'),
  type: z.enum(['EXPENSE', 'INCOME']),
  categoryId: z.string().optional(),
  creditCardId: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const todayIso = () => new Date().toISOString().slice(0, 10)

export function TransactionForm() {
  const queryClient = useQueryClient()
  const { data: creditCards } = useQuery({ queryKey: ['credit-cards'], queryFn: () => listCreditCards() })

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'EXPENSE', occurredOn: todayIso(), amount: 0, description: '' },
  })

  const selectedType = watch('type')

  const mutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
      reset({
        description: '',
        amount: 0,
        occurredOn: todayIso(),
        type: selectedType,
        categoryId: undefined,
        creditCardId: undefined,
      })
    },
  })

  return (
    <form
      onSubmit={handleSubmit((values) =>
        mutation.mutate({
          description: values.description,
          amount: values.amount,
          occurredOn: values.occurredOn,
          type: values.type,
          categoryId: values.categoryId || null,
          creditCardId: values.creditCardId || null,
          recurring: false,
          notes: null,
        }),
      )}
      className="space-y-4"
    >
      <div>
        <span className={labelClass}>Tipo</span>
        <div className="mt-1.5 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de transação">
          <button
            type="button"
            role="radio"
            aria-checked={selectedType === 'EXPENSE'}
            onClick={() => setValue('type', 'EXPENSE')}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
              selectedType === 'EXPENSE'
                ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-500/10 dark:text-red-400'
                : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingDownIcon className="h-4 w-4" /> Gasto
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={selectedType === 'INCOME'}
            onClick={() => setValue('type', 'INCOME')}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
              selectedType === 'INCOME'
                ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-500/10 dark:text-green-400'
                : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUpIcon className="h-4 w-4" /> Receita
          </button>
        </div>
      </div>

      <Field label="Descrição" htmlFor="tx-description" error={errors.description?.message}>
        <input id="tx-description" className={inputClass} placeholder="Ex: Supermercado" {...register('description')} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Valor" htmlFor="tx-amount" error={errors.amount?.message}>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                id="tx-amount"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                className={inputClass}
                aria-invalid={!!errors.amount}
              />
            )}
          />
        </Field>

        <Field label="Data" htmlFor="tx-date">
          <input id="tx-date" type="date" className={inputClass} {...register('occurredOn')} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoria" htmlFor="tx-category">
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <CategorySelect id="tx-category" value={field.value} onChange={field.onChange} type={selectedType} />
            )}
          />
        </Field>

        {creditCards && creditCards.length > 0 && (
          <Field label="Cartão" htmlFor="tx-card">
            <select id="tx-card" className={inputClass} {...register('creditCardId')}>
              <option value="">Nenhum</option>
              {creditCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <Button type="submit" loading={mutation.isPending} className="w-full">
        {mutation.isPending ? 'Salvando…' : 'Adicionar transação'}
      </Button>
    </form>
  )
}
