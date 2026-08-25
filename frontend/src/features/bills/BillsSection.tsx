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
import { checkboxClass, inputClass } from '../../components/ui/formStyles'
import { CheckCircleIcon, FileTextIcon, PlusIcon, TrashIcon, XIcon } from '../../components/icons'
import { formatBRL } from '../../lib/currency'
import { createBill, deleteBill, listBills, markBillPaid } from './api'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const schema = z.object({
  description: z.string().min(1, 'obrigatório'),
  amount: z.number().positive('informe um valor'),
  dueDate: z.string().min(1, 'obrigatório'),
  recurring: z.boolean(),
})

type FormValues = z.infer<typeof schema>

export function BillsSection() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const { data: bills, isLoading } = useQuery({ queryKey: ['bills'], queryFn: listBills })

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { description: '', amount: 0, dueDate: '', recurring: false } })

  const createMutation = useMutation({
    mutationFn: createBill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      reset({ description: '', amount: 0, dueDate: '', recurring: false })
      setShowForm(false)
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

  const pendingBills = (bills ?? [])
    .filter((bill) => bill.status === 'PENDING')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  return (
    <Card>
      <CardHeader
        icon={<FileTextIcon />}
        title="Contas a pagar"
        description="Vencimentos próximos, ordenados por data"
        action={
          <Button type="button" variant={showForm ? 'secondary' : 'primary'} size="sm" onClick={() => setShowForm((value) => !value)}>
            {showForm ? <XIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
            {showForm ? 'Cancelar' : 'Nova conta'}
          </Button>
        }
      />

      <CardBody className="space-y-4">
        {showForm && (
          <form
            onSubmit={handleSubmit((values) =>
              createMutation.mutate({
                description: values.description,
                amount: values.amount,
                dueDate: values.dueDate,
                recurring: values.recurring,
                reminderDaysBefore: 3,
              }),
            )}
            className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-950/50"
          >
            <Field label="Descrição" htmlFor="bill-description" error={errors.description?.message} className="col-span-2">
              <input id="bill-description" className={inputClass} placeholder="Aluguel" {...register('description')} />
            </Field>
            <Field label="Valor" htmlFor="bill-amount" error={errors.amount?.message}>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    id="bill-amount"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className={inputClass}
                    aria-invalid={!!errors.amount}
                  />
                )}
              />
            </Field>
            <Field label="Vencimento" htmlFor="bill-due" error={errors.dueDate?.message}>
              <input id="bill-due" type="date" className={inputClass} {...register('dueDate')} />
            </Field>
            <label className="col-span-2 flex items-center gap-2 text-sm text-slate-600 sm:col-span-4 dark:text-slate-400">
              <input type="checkbox" className={checkboxClass} {...register('recurring')} />
              Conta recorrente (todo mês)
            </label>
            <Button type="submit" loading={createMutation.isPending} className="col-span-2 sm:col-span-4">
              Adicionar conta
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

        {!isLoading && pendingBills.length === 0 && (
          <EmptyState
            icon={<CheckCircleIcon className="h-6 w-6" />}
            title="Tudo em dia"
            description="Nenhuma conta pendente no momento."
            action={
              !showForm && (
                <Button size="sm" onClick={() => setShowForm(true)}>
                  <PlusIcon className="h-4 w-4" /> Nova conta
                </Button>
              )
            }
          />
        )}

        {pendingBills.length > 0 && (
          <ul className="space-y-2">
            {pendingBills.map((bill) => (
              <li
                key={bill.id}
                className={`group flex items-center justify-between gap-3 rounded-xl border p-3.5 ${
                  bill.overdue
                    ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-slate-900 dark:text-white">{bill.description}</p>
                    {bill.overdue && <Badge tone="danger">Atrasada</Badge>}
                    {bill.recurring && <Badge tone="info">Recorrente</Badge>}
                  </div>
                  <p className={`text-xs ${bill.overdue ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    Vence em {dateFormatter.format(new Date(`${bill.dueDate}T00:00:00`))}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">{formatBRL(bill.amount)}</span>
                  <Button size="sm" onClick={() => payMutation.mutate(bill.id)} loading={payMutation.isPending && payMutation.variables === bill.id}>
                    Pagar
                  </Button>
                  <button
                    onClick={() => deleteMutation.mutate(bill.id)}
                    className="rounded-lg p-2 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    aria-label={`Remover conta ${bill.description}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
