import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { inputClass, labelClass } from '../../components/ui/formStyles'
import { TrendingDownIcon, TrendingUpIcon } from '../../components/icons'
import { createCategory, type CategoryType } from './api'

const PRESET_COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#a855f7', '#f59e0b', '#22c55e', '#64748b']

export function NewCategoryModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [type, setType] = useState<CategoryType>('EXPENSE')
  const [color, setColor] = useState(PRESET_COLORS[0])

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      onClose()
    },
  })

  const submit = () => {
    if (!name.trim()) return
    createMutation.mutate({ name: name.trim(), color, icon: null, type })
  }

  return (
    <Modal title="Nova categoria" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <span className={labelClass}>Tipo</span>
          <div className="mt-1.5 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de categoria">
            <button
              type="button"
              role="radio"
              aria-checked={type === 'EXPENSE'}
              onClick={() => setType('EXPENSE')}
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                type === 'EXPENSE'
                  ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-500/10 dark:text-red-400'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <TrendingDownIcon className="h-4 w-4" /> Gasto
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={type === 'INCOME'}
              onClick={() => setType('INCOME')}
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                type === 'INCOME'
                  ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-500/10 dark:text-green-400'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <TrendingUpIcon className="h-4 w-4" /> Receita
            </button>
          </div>
        </div>

        <Field label="Nome" htmlFor="new-category-name">
          <input
            id="new-category-name"
            autoFocus
            className={inputClass}
            placeholder="Ex: Lazer"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                submit()
              }
            }}
          />
        </Field>

        <div>
          <span className={labelClass}>Cor</span>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Cor da categoria">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset}
                type="button"
                role="radio"
                aria-checked={color === preset}
                aria-label={`Cor ${preset}`}
                onClick={() => setColor(preset)}
                className={`h-7 w-7 rounded-full transition ${
                  color === preset ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900' : ''
                }`}
                style={{ backgroundColor: preset }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" disabled={!name.trim()} loading={createMutation.isPending} onClick={submit}>
            Salvar categoria
          </Button>
        </div>
      </div>
    </Modal>
  )
}
