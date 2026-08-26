import { useState } from 'react'
import { FloatingPanel } from '../../components/ui/FloatingPanel'
import { inputClass } from '../../components/ui/formStyles'
import { CalendarIcon, CheckIcon } from '../../components/icons'
import { useFloatingPanel } from '../../lib/useFloatingPanel'

interface YearPickerProps {
  id: string
  value: number
  onChange: (value: number) => void
  maxYear: number
  minYear?: number
}

/** Custom year picker (trigger + floating list) — see MonthPicker. */
export function YearPicker({ id, value, onChange, maxYear, minYear = maxYear - 14 }: YearPickerProps) {
  const [open, setOpen] = useState(false)
  const { triggerRef, panelRef, position } = useFloatingPanel(open, () => setOpen(false))

  const years: number[] = []
  for (let year = maxYear; year >= minYear; year--) years.push(year)

  const selectYear = (year: number) => {
    onChange(year)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        id={id}
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        className={`${inputClass} flex items-center gap-2 text-left`}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="flex-1 truncate">{value}</span>
      </button>

      {open && position && (
        <FloatingPanel panelRef={panelRef} position={position} widthOverride={140}>
          <ul role="listbox" aria-label="Ano" className="max-h-60 overflow-y-auto py-1">
            {years.map((year) => (
              <li key={year}>
                <button
                  type="button"
                  role="option"
                  aria-selected={year === value}
                  onClick={() => selectYear(year)}
                  className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {year}
                  {year === value && <CheckIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
                </button>
              </li>
            ))}
          </ul>
        </FloatingPanel>
      )}
    </>
  )
}
