import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { currentMonthStart } from '../../lib/date'
import { createCreditCard, deleteCreditCard, listCreditCards } from './api'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const schema = z.object({
  name: z.string().min(1, 'obrigatório'),
  brand: z.string().optional(),
  closingDay: z.string().min(1, 'obrigatório'),
  dueDay: z.string().min(1, 'obrigatório'),
})

type FormValues = z.infer<typeof schema>

export function CreditCardsSection() {
  const month = currentMonthStart()
  const queryClient = useQueryClient()

  const { data: cards, isLoading } = useQuery({
    queryKey: ['credit-cards', month],
    queryFn: () => listCreditCards(month),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', closingDay: '5', dueDay: '10' } })

  const createMutation = useMutation({
    mutationFn: createCreditCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
      reset({ name: '', brand: '', closingDay: '5', dueDay: '10' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCreditCard,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['credit-cards'] }),
  })

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Cartões de crédito</h2>

      {isLoading && <p className="text-sm text-slate-500">Carregando…</p>}

      {cards && cards.length > 0 && (
        <ul className="space-y-2">
          {cards.map((card) => (
            <li
              key={card.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800"
            >
              <div>
                <p className="font-medium">
                  {card.name} {card.brand && <span className="text-slate-500">({card.brand})</span>}
                </p>
                <p className="text-xs text-slate-500">
                  Fecha dia {card.closingDay}, vence dia {card.dueDay}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span>Fatura: {currency.format(card.invoiceAmount ?? 0)}</span>
                <button
                  onClick={() => deleteMutation.mutate(card.id)}
                  className="text-xs text-slate-400 hover:text-red-600"
                  aria-label="Remover cartão"
                >
                  remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleSubmit((values) =>
          createMutation.mutate({
            name: values.name,
            brand: values.brand || null,
            creditLimit: null,
            closingDay: Number(values.closingDay),
            dueDay: Number(values.dueDay),
          }),
        )}
        className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800"
      >
        <div>
          <label className="block text-xs font-medium">Nome</label>
          <input
            className="mt-1 w-32 rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            placeholder="Nubank"
            {...register('name')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium">Bandeira</label>
          <input
            className="mt-1 w-28 rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            placeholder="Mastercard"
            {...register('brand')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium">Fecha dia</label>
          <input
            type="number"
            min={1}
            max={31}
            className="mt-1 w-16 rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            {...register('closingDay')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium">Vence dia</label>
          <input
            type="number"
            min={1}
            max={31}
            className="mt-1 w-16 rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            {...register('dueDay')}
          />
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-slate-50 dark:text-slate-900"
        >
          Adicionar cartão
        </button>
        {(errors.name || errors.closingDay || errors.dueDay) && (
          <p className="w-full text-xs text-red-600">
            {errors.name?.message ?? errors.closingDay?.message ?? errors.dueDay?.message}
          </p>
        )}
      </form>
    </section>
  )
}
