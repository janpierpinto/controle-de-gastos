import { useState } from 'react'
import { CheckIcon, ChevronDownIcon } from '../icons'
import { useFloatingPanel } from '../../lib/useFloatingPanel'
import { FloatingPanel } from './FloatingPanel'
import { inputClass } from './formStyles'

export interface SimpleSelectOption {
  value: string
  label: string
}

interface SimpleSelectProps {
  id: string
  value: string
  onChange: (value: string) => void
  options: SimpleSelectOption[]
  placeholder?: string
  disabled?: boolean
}

/**
 * Generic themed dropdown for a flat list of value/label options — not a
 * native <select>, which renders with OS-default chrome that clashes with
 * the app's dark theme (see CategorySelect for the original fix, and the
 * design-ux-standard memory note it's not supposed to happen a second time).
 * Use this instead of a bespoke component when the options are just a flat
 * static or fetched list (see CurrencySelect/RoleSelect for the richer
 * per-item-description variant).
 */
export function SimpleSelect({ id, value, onChange, options, placeholder = 'Selecione', disabled = false }: SimpleSelectProps) {
  const [open, setOpen] = useState(false)
  const { triggerRef, panelRef, position } = useFloatingPanel(open, () => setOpen(false))

  const selected = options.find((option) => option.value === value)

  const select = (optionValue: string) => {
    onChange(optionValue)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        id={id}
        ref={triggerRef}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`${inputClass} flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className={`truncate ${selected ? '' : 'text-slate-400 dark:text-slate-500'}`}>{selected?.label ?? placeholder}</span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && position && (
        <FloatingPanel panelRef={panelRef} position={position}>
          <ul role="listbox" aria-label={placeholder} className="max-h-60 overflow-y-auto py-1">
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => select(option.value)}
                  className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span className="truncate">{option.label}</span>
                  {option.value === value && <CheckIcon className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />}
                </button>
              </li>
            ))}
          </ul>
        </FloatingPanel>
      )}
    </>
  )
}
