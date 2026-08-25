import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { inputClass } from '../../components/ui/formStyles'
import { PlusIcon } from '../../components/icons'
import { createCategory, listCategories, type CategoryType } from './api'

const PRESET_COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#a855f7', '#f59e0b', '#22c55e', '#64748b']

interface CategorySelectProps {
  id: string
  value: string | undefined
  onChange: (value: string) => void
  type: CategoryType
  allowEmpty?: boolean
  emptyLabel?: string
  excludeIds?: string[]
}

/**
 * Native <select> plus a "+" trigger that reveals an inline creation form
 * instead of forcing the user out to a separate categories screen. Not a
 * <form> itself on purpose — this nests inside TransactionForm/BudgetsSection's
 * own <form>, and nested <form> elements are invalid HTML (and would let
 * Enter here submit the outer form instead of just creating the category).
 */
export function CategorySelect({
  id,
  value,
  onChange,
  type,
  allowEmpty = true,
  emptyLabel = 'Sem categoria',
  excludeIds,
}: CategorySelectProps) {
  const queryClient = useQueryClient()
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: listCategories })
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      onChange(category.id)
      setCreating(false)
      setName('')
    },
  })

  const visible = (categories ?? []).filter(
    (category) => category.type === type && !excludeIds?.includes(category.id),
  )

  const submitNewCategory = () => {
    if (!name.trim()) return
    createMutation.mutate({ name: name.trim(), color, icon: null, type })
  }

  if (creating) {
    return (
      <div className="space-y-2.5 rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 dark:border-indigo-500/30 dark:bg-indigo-500/5">
        <input
          autoFocus
          className={inputClass}
          placeholder="Nome da categoria"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              submitNewCategory()
            } else if (event.key === 'Escape') {
              setCreating(false)
            }
          }}
        />
        <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Cor da categoria">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset}
              type="button"
              role="radio"
              aria-checked={color === preset}
              aria-label={`Cor ${preset}`}
              onClick={() => setColor(preset)}
              className={`h-6 w-6 rounded-full transition ${
                color === preset ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900' : ''
              }`}
              style={{ backgroundColor: preset }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" disabled={!name.trim()} loading={createMutation.isPending} onClick={submitNewCategory}>
            Salvar categoria
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => setCreating(false)}>
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <select id={id} className={inputClass} value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
        {allowEmpty && <option value="">{emptyLabel}</option>}
        {visible.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setCreating(true)}
        aria-label="Nova categoria"
        title="Nova categoria"
        className="flex w-11 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  )
}
