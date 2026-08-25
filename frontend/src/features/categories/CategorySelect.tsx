import { useQuery } from '@tanstack/react-query'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { inputClass } from '../../components/ui/formStyles'
import { CheckIcon, ChevronDownIcon, SearchIcon } from '../../components/icons'
import { listCategories, type Category, type CategoryType } from './api'

const FALLBACK_COLOR = '#64748b'
const PANEL_MARGIN = 8
const PANEL_MAX_HEIGHT = 288
const PANEL_MIN_HEIGHT = 160

interface CategorySelectProps {
  id: string
  value: string | undefined
  onChange: (value: string) => void
  type: CategoryType
  allowEmpty?: boolean
  emptyLabel?: string
  excludeIds?: string[]
}

interface PanelPosition {
  left: number
  width: number
  maxHeight: number
  openUp: boolean
  rectTop: number
  rectBottom: number
}

function Dot({ color }: { color: string | null }) {
  return <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color ?? FALLBACK_COLOR }} />
}

/**
 * Custom listbox (not a native <select>) so the trigger, panel and options
 * match the app's dark theme. The panel is portaled to <body> and
 * fixed-positioned with a height capped to whatever viewport space is
 * actually available below/above the trigger — opening it never grows the
 * page's scroll height, and it flips upward near the bottom of the screen.
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
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: listCategories })
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [position, setPosition] = useState<PanelPosition | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const updatePosition = () => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - PANEL_MARGIN
    const spaceAbove = rect.top - PANEL_MARGIN
    const openUp = spaceBelow < PANEL_MIN_HEIGHT && spaceAbove > spaceBelow
    const maxHeight = Math.min(PANEL_MAX_HEIGHT, Math.max(PANEL_MIN_HEIGHT, openUp ? spaceAbove : spaceBelow))
    setPosition({ left: rect.left, width: rect.width, maxHeight, openUp, rectTop: rect.top, rectBottom: rect.bottom })
  }

  useLayoutEffect(() => {
    if (open) updatePosition()
  }, [open])

  useEffect(() => {
    if (!open) {
      setSearch('')
      return
    }
    const onReposition = () => updatePosition()
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  const visible = (categories ?? []).filter(
    (category) =>
      category.type === type &&
      !excludeIds?.includes(category.id) &&
      category.name.toLowerCase().includes(search.trim().toLowerCase()),
  )
  const selected: Category | undefined = categories?.find((category) => category.id === value)

  const selectOption = (optionId: string) => {
    onChange(optionId)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        id={id}
        ref={triggerRef}
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

      {open &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: 'fixed',
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
              top: position.openUp ? undefined : position.rectBottom + PANEL_MARGIN,
              bottom: position.openUp ? window.innerHeight - position.rectTop + PANEL_MARGIN : undefined,
            }}
            className="z-50 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="relative shrink-0 border-b border-slate-100 p-2 dark:border-slate-800">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-4.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar categoria..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-3 pl-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <ul role="listbox" aria-label="Categorias" className="min-h-0 flex-1 overflow-y-auto py-1">
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
                <li className="px-3.5 py-2.5 text-sm text-slate-400 dark:text-slate-500">Nenhuma categoria encontrada</li>
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
          </div>,
          document.body,
        )}
    </>
  )
}
