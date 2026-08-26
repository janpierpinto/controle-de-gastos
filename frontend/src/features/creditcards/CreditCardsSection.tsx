import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field } from '../../components/ui/Field'
import { inputClass } from '../../components/ui/formStyles'
import { CreditCardIcon, PlusIcon, TrashIcon, XIcon } from '../../components/icons'
import { currentMonthStart } from '../../lib/date'
import { formatCurrency } from '../../lib/currency'
import { useCurrency } from '../family/useCurrency'
import { createCreditCard, deleteCreditCard, listCreditCards } from './api'

const schema = z.object({
  name: z.string().min(1, 'obrigatório'),
  brand: z.string().optional(),
  closingDay: z.string().min(1, 'obrigatório'),
  dueDay: z.string().min(1, 'obrigatório'),
})

type FormValues = z.infer<typeof schema>

const CARD_GRADIENTS = [
  'from-indigo-500 to-violet-600',
  'from-slate-700 to-slate-900',
  'from-rose-500 to-orange-500',
  'from-emerald-500 to-teal-600',
]

export function CreditCardsSection() {
  const currency = useCurrency()
  const month = currentMonthStart()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

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
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCreditCard,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['credit-cards'] }),
  })

  return (
    <Card>
      <CardHeader
        icon={<CreditCardIcon />}
        title="Cartões de crédito"
        description="Fatura calculada pelo mês da compra"
        action={
          <Button type="button" variant={showForm ? 'secondary' : 'primary'} size="sm" onClick={() => setShowForm((value) => !value)}>
            {showForm ? <XIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
            {showForm ? 'Cancelar' : 'Novo cartão'}
          </Button>
        }
      />

      <CardBody className="space-y-4">
        {showForm && (
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
            className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-950/50"
          >
            <Field label="Nome" htmlFor="card-name" error={errors.name?.message} className="col-span-2 sm:col-span-1">
              <input id="card-name" className={inputClass} placeholder="Nubank" {...register('name')} />
            </Field>
            <Field label="Bandeira" htmlFor="card-brand" className="col-span-2 sm:col-span-1">
              <input id="card-brand" className={inputClass} placeholder="Mastercard" {...register('brand')} />
            </Field>
            <Field label="Fecha dia" htmlFor="card-closing" error={errors.closingDay?.message}>
              <input id="card-closing" type="number" min={1} max={31} className={inputClass} {...register('closingDay')} />
            </Field>
            <Field label="Vence dia" htmlFor="card-due" error={errors.dueDay?.message}>
              <input id="card-due" type="number" min={1} max={31} className={inputClass} {...register('dueDay')} />
            </Field>
            <Button type="submit" loading={createMutation.isPending} className="col-span-2 sm:col-span-4">
              Adicionar cartão
            </Button>
          </form>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[0, 1].map((key) => (
              <div key={key} className="aspect-video animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        )}

        {!isLoading && (!cards || cards.length === 0) && (
          <EmptyState
            icon={<CreditCardIcon className="h-6 w-6" />}
            title="Nenhum cartão cadastrado"
            description="Cadastre seus cartões para marcar transações e acompanhar a fatura do mês."
            action={
              !showForm && (
                <Button size="sm" onClick={() => setShowForm(true)}>
                  <PlusIcon className="h-4 w-4" /> Novo cartão
                </Button>
              )
            }
          />
        )}

        {cards && cards.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className={`group relative flex aspect-video flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-md ${CARD_GRADIENTS[index % CARD_GRADIENTS.length]}`}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl"
                />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{card.name}</p>
                    {card.brand && <p className="text-xs text-white/70">{card.brand}</p>}
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(card.id)}
                    className="rounded-lg p-1.5 text-white/60 opacity-0 transition hover:bg-white/15 hover:text-white focus-visible:opacity-100 group-hover:opacity-100"
                    aria-label={`Remover cartão ${card.name}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="relative">
                  <p className="text-xs text-white/70">Fatura do mês</p>
                  <p className="text-xl font-bold">{formatCurrency(card.invoiceAmount ?? 0, currency)}</p>
                  <p className="mt-1 text-xs text-white/70">
                    Fecha dia {card.closingDay} · vence dia {card.dueDay}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
