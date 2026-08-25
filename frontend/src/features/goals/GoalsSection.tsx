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
import { CheckCircleIcon, PlusIcon, TargetIcon, TrashIcon, XIcon } from '../../components/icons'
import { formatBRL } from '../../lib/currency'
import { contributeToGoal, createGoal, deleteGoal, listGoals, type Goal } from './api'

const schema = z.object({
  name: z.string().min(1, 'obrigatório'),
  targetAmount: z.number().positive('informe um valor'),
  targetDate: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

function GoalContributionForm({ goal, onDone }: { goal: Goal; onDone: () => void }) {
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState(0)

  const mutation = useMutation({
    mutationFn: (value: number) => contributeToGoal(goal.id, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      onDone()
    },
  })

  return (
    <div className="mt-3 flex items-center gap-2">
      <CurrencyInput
        id={`goal-contribution-${goal.id}`}
        value={amount}
        onChange={setAmount}
        className={`${inputClass} py-2`}
        aria-label="Valor a adicionar"
      />
      <Button
        type="button"
        size="sm"
        disabled={amount <= 0}
        loading={mutation.isPending}
        onClick={() => mutation.mutate(amount)}
      >
        Adicionar
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={onDone}>
        Cancelar
      </Button>
    </div>
  )
}

export function GoalsSection() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [contributingId, setContributingId] = useState<string | null>(null)

  const { data: goals, isLoading } = useQuery({ queryKey: ['goals'], queryFn: listGoals })

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', targetAmount: 0, targetDate: '' } })

  const createMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      reset({ name: '', targetAmount: 0, targetDate: '' })
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  })

  return (
    <Card>
      <CardHeader
        icon={<TargetIcon />}
        title="Metas"
        description="Guarde dinheiro para seus objetivos e acompanhe o progresso"
        action={
          <Button type="button" variant={showForm ? 'secondary' : 'primary'} size="sm" onClick={() => setShowForm((value) => !value)}>
            {showForm ? <XIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
            {showForm ? 'Cancelar' : 'Nova meta'}
          </Button>
        }
      />

      <CardBody className="space-y-4">
        {showForm && (
          <form
            onSubmit={handleSubmit((values) =>
              createMutation.mutate({
                name: values.name,
                targetAmount: values.targetAmount,
                targetDate: values.targetDate || null,
              }),
            )}
            className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3 sm:items-end dark:border-slate-800 dark:bg-slate-950/50"
          >
            <Field label="Nome da meta" htmlFor="goal-name" error={errors.name?.message}>
              <input id="goal-name" className={inputClass} placeholder="Ex: Viagem, Reserva de emergência" {...register('name')} />
            </Field>
            <Field label="Valor alvo" htmlFor="goal-amount" error={errors.targetAmount?.message}>
              <Controller
                name="targetAmount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    id="goal-amount"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className={inputClass}
                    aria-invalid={!!errors.targetAmount}
                  />
                )}
              />
            </Field>
            <div className="flex gap-2">
              <Field label="Prazo (opcional)" htmlFor="goal-date" className="flex-1">
                <input id="goal-date" type="date" className={inputClass} {...register('targetDate')} />
              </Field>
              <Button type="submit" loading={createMutation.isPending} className="mb-[1px] self-end">
                Salvar
              </Button>
            </div>
          </form>
        )}

        {isLoading && (
          <div className="space-y-2">
            {[0, 1].map((key) => (
              <div key={key} className="h-20 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        )}

        {!isLoading && (!goals || goals.length === 0) && (
          <EmptyState
            icon={<TargetIcon className="h-6 w-6" />}
            title="Nenhuma meta ainda"
            description="Crie uma meta para guardar dinheiro para uma viagem, reserva de emergência ou o que quiser."
            action={
              !showForm && (
                <Button size="sm" onClick={() => setShowForm(true)}>
                  <PlusIcon className="h-4 w-4" /> Nova meta
                </Button>
              )
            }
          />
        )}

        {goals && goals.length > 0 && (
          <ul className="space-y-3">
            {goals.map((goal) => {
              const barColor = goal.completed ? 'bg-green-500' : 'bg-indigo-600'
              return (
                <li key={goal.id} className="group rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
                      {goal.name}
                      {goal.completed && <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />}
                    </span>
                    <div className="flex items-center gap-2">
                      {goal.completed && <Badge tone="success">Concluída</Badge>}
                      {goal.targetDate && !goal.completed && (
                        <Badge tone="neutral">até {dateFormatter.format(new Date(`${goal.targetDate}T00:00:00`))}</Badge>
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(goal.id)}
                        className="rounded-lg p-1.5 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                        aria-label={`Remover meta ${goal.name}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${goal.percentageComplete}%` }} />
                  </div>

                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    {formatBRL(goal.currentAmount)}{' '}
                    <span className="text-slate-400 dark:text-slate-500">de {formatBRL(goal.targetAmount)}</span>{' '}
                    <span className="text-slate-400 dark:text-slate-500">({goal.percentageComplete}%)</span>
                  </p>

                  {!goal.completed &&
                    (contributingId === goal.id ? (
                      <GoalContributionForm goal={goal} onDone={() => setContributingId(null)} />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setContributingId(goal.id)}
                        className="mt-2.5 flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <PlusIcon className="h-3.5 w-3.5" /> Adicionar valor
                      </button>
                    ))}
                </li>
              )
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
