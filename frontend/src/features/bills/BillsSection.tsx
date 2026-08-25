import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { createBill, deleteBill, listBills, markBillPaid } from './api'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const schema = z.object({
  description: z.string().min(1, 'obrigatório'),
  amount: z
    .string()
    .min(1, 'obrigatório')
    .refine((value) => Number(value) > 0, 'deve ser positivo'),
  dueDate: z.string().min(1, 'obrigatório'),
  recurring: z.boolean(),
})

type FormValues = z.infer<typeof schema>

export function BillsSection() {
  const queryClient = useQueryClient()
  const { data: bills, isLoading } = useQuery({ queryKey: ['bills'], queryFn: listBills })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { description: '', amount: '', dueDate: '', recurring: false } })

  const createMutation = useMutation({
    mutationFn: createBill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      reset({ description: '', amount: '', dueDate: '', recurring: false })
    },
  })

  const payMutation = useMutation({
    mutationFn: markBillPaid,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bills'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBill,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bills'] }),
  })

  const pendingBills = (bills ?? []).filter((bill) => bill.status === 'PENDING')

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Contas a pagar</h2>

      {isLoading && <p className="text-sm text-slate-500">Carregando…</p>}

      {pendingBills.length > 0 && (
        <ul className="space-y-2">
          {pendingBills.map((bill) => (
            <li
              key={bill.id}
              className={`flex items-center justify-between rounded-lg border p-3 text-sm ${
                bill.overdue
                  ? 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                <p className="font-medium">{bill.description}</p>
                <p className={`text-xs ${bill.overdue ? 'text-red-600' : 'text-slate-500'}`}>
                  Vence em {dateFormatter.format(new Date(`${bill.dueDate}T00:00:00`))}
                  {bill.overdue && ' — atrasada'}
                  {bill.recurring && ' · recorrente'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span>{currency.format(bill.amount)}</span>
                <button
                  onClick={() => payMutation.mutate(bill.id)}
                  className="rounded bg-green-600 px-2 py-1 text-xs text-white"
                >
                  pagar
                </button>
                <button
                  onClick={() => deleteMutation.mutate(bill.id)}
                  className="text-xs text-slate-400 hover:text-red-600"
                  aria-label="Remover conta"
                >
                  remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pendingBills.length === 0 && !isLoading && <p className="text-sm text-slate-500">Nenhuma conta pendente.</p>}

      <form
        onSubmit={handleSubmit((values) =>
          createMutation.mutate({
            description: values.description,
            amount: Number(values.amount),
            dueDate: values.dueDate,
            recurring: values.recurring,
            reminderDaysBefore: 3,
          }),
        )}
        className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800"
      >
        <div>
          <label className="block text-xs font-medium">Descrição</label>
          <input
            className="mt-1 w-36 rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            placeholder="Aluguel"
            {...register('description')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            className="mt-1 w-24 rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            {...register('amount')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium">Vencimento</label>
          <input
            type="date"
            className="mt-1 rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            {...register('dueDate')}
          />
        </div>
        <label className="flex items-center gap-1 pb-1.5 text-xs">
          <input type="checkbox" {...register('recurring')} />
          Recorrente
        </label>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-slate-50 dark:text-slate-900"
        >
          Adicionar conta
        </button>
        {(errors.description || errors.amount || errors.dueDate) && (
          <p className="w-full text-xs text-red-600">
            {errors.description?.message ?? errors.amount?.message ?? errors.dueDate?.message}
          </p>
        )}
      </form>
    </section>
  )
}
