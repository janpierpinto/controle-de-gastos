import { useState } from 'react'
import { FloatingPanel } from '../../components/ui/FloatingPanel'
import { inputClass } from '../../components/ui/formStyles'
import { CheckIcon, ChevronDownIcon } from '../../components/icons'
import { CURRENCY_LABELS, SUPPORTED_CURRENCIES, currencySymbol, type CurrencyCode } from '../../lib/currency'
import { useFloatingPanel } from '../../lib/useFloatingPanel'

interface CurrencySelectProps {
  id: string
  value: CurrencyCode
  onChange: (value: CurrencyCode) => void
  disabled?: boolean
}

/** Custom currency dropdown — not a native <select>, same reasoning as CategorySelect/MonthPicker. */
export function CurrencySelect({ id, value, onChange, disabled = false }: CurrencySelectProps) {
  const [open, setOpen] = useState(false)
  const { triggerRef, panelRef, position } = useFloatingPanel(open, () => setOpen(false))

  const select = (currency: CurrencyCode) => {
    onChange(currency)
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
        <span className="truncate">
          {currencySymbol(value)} · {CURRENCY_LABELS[value]}
        </span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && position && (
        <FloatingPanel panelRef={panelRef} position={position}>
          <ul role="listbox" aria-label="Moeda" className="max-h-60 overflow-y-auto py-1">
            {SUPPORTED_CURRENCIES.map((currency) => (
              <li key={currency}>
                <button
                  type="button"
                  role="option"
                  aria-selected={currency === value}
                  onClick={() => select(currency)}
                  className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span>
                    {currencySymbol(currency)} · {CURRENCY_LABELS[currency]}
                  </span>
                  {currency === value && <CheckIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
                </button>
              </li>
            ))}
          </ul>
        </FloatingPanel>
      )}
    </>
  )
}
