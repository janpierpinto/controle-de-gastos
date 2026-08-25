import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { inputClass } from '../../components/ui/formStyles'
import { CheckIcon, ChevronDownIcon, PlusIcon } from '../../components/icons'
import { createCategory, listCategories, type Category, type CategoryType } from './api'

const PRESET_COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#a855f7', '#f59e0b', '#22c55e', '#64748b']
const FALLBACK_COLOR = '#64748b'

interface CategorySelectProps {
  id: string
  value: string | undefined
  onChange: (value: string) => void
  type: CategoryType
  allowEmpty?: boolean
  emptyLabel?: string
  excludeIds?: string[]
}

function Dot({ color }: { color: string | null }) {
  return <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color ?? FALLBACK_COLOR }} />
}

/**
 * Custom listbox (not a native <select>) so the trigger, panel and options
 * match the app's dark theme instead of the OS/browser default control —
 * plus a "Nova categoria" row that lets users create a missing category
 * without leaving the form. Not a <form> itself on purpose — this nests
 * inside TransactionForm/BudgetsSection's own <form>.
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
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const containerRef = useRef<HTMLDivElement>(null)

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      onChange(category.id)
      setCreating(false)
      setOpen(false)
      setName('')
      setColor(PRESET_COLORS[0])
    },
  })

  useEffect(() => {
    if (!open) return
    const onClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
        setCreating(false)
      }
    }
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (creating) setCreating(false)
      else setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open, creating])

  const visible = (categories ?? []).filter(
    (category) => category.type === type && !excludeIds?.includes(category.id),
  )
  const selected: Category | undefined = categories?.find((category) => category.id === value)

  const submitNewCategory = () => {
    if (!name.trim()) return
    createMutation.mutate({ name: name.trim(), color, icon: null, type })
  }

  const selectOption = (id: string) => {
    onChange(id)
    setOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${inputClass} flex items-center justify-between gap-2 text-left ${open ? 'border-indigo-500 ring-2 ring-indigo-500/30' : ''}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected && <Dot color={selected.color} />}
          <span className={`truncate ${selected ? '' : 'text-slate-400 dark:text-slate-500'}`}>{selected?.name ?? emptyLabel}</span>
        </span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {creating ? (
            <div className="space-y-2.5 p-3">
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
          ) : (
            <>
              <ul role="listbox" aria-label="Categorias" className="max-h-52 overflow-y-auto py-1">
                {allowEmpty && (
                  <li>
                    <button
                      type="button"
                      role="option"
                      aria-selected={!value}
                      onClick={() => selectOption('')}
                      className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm text-slate-500 transition hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                      {emptyLabel}
                      {!value && <CheckIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
                    </button>
                  </li>
                )}
                {visible.length === 0 && (
                  <li className="px-3.5 py-2.5 text-sm text-slate-400 dark:text-slate-500">Nenhuma categoria ainda</li>
                )}
                {visible.map((category) => (
                  <li key={category.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={value === category.id}
                      onClick={() => selectOption(category.id)}
                      className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Dot color={category.color} />
                        <span className="truncate">{category.name}</span>
                      </span>
                      {value === category.id && <CheckIcon className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />}
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-2 border-t border-slate-100 px-3.5 py-2.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 dark:border-slate-800 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
              >
                <PlusIcon className="h-4 w-4" /> Nova categoria
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
