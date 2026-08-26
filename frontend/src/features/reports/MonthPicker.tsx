import { useState } from 'react'
import { FloatingPanel } from '../../components/ui/FloatingPanel'
import { inputClass } from '../../components/ui/formStyles'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '../../components/icons'
import { useFloatingPanel } from '../../lib/useFloatingPanel'

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MONTH_FULL_FORMATTER = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

interface MonthPickerProps {
  id: string
  value: string
  onChange: (value: string) => void
  maxMonth?: string
}

/**
 * Custom calendar-style month picker (trigger + floating year/month grid) —
 * not a native <input type="month">, which renders with OS-default chrome
 * that clashes with the app's dark theme, same reasoning as CategorySelect.
 */
export function MonthPicker({ id, value, onChange, maxMonth }: MonthPickerProps) {
  const [open, setOpen] = useState(false)
  const [selectedYear, selectedMonthIndex] = value.split('-').map(Number)
  const [displayYear, setDisplayYear] = useState(selectedYear)
  const { triggerRef, panelRef, position } = useFloatingPanel(open, () => setOpen(false))

  const [maxYear, maxMonthIndex] = maxMonth ? maxMonth.split('-').map(Number) : [Infinity, 12]

  const label = capitalize(MONTH_FULL_FORMATTER.format(new Date(selectedYear, selectedMonthIndex - 1, 1)))

  const openPanel = () => {
    setDisplayYear(selectedYear)
    setOpen((v) => !v)
  }

  const selectMonth = (monthIndex: number) => {
    onChange(`${displayYear}-${String(monthIndex).padStart(2, '0')}`)
    setOpen(false)
  }

  const isMonthDisabled = (monthIndex: number) =>
    displayYear > maxYear || (displayYear === maxYear && monthIndex > maxMonthIndex)

  return (
    <>
      <button type="button" id={id} ref={triggerRef} onClick={openPanel} className={`${inputClass} flex items-center gap-2 text-left`}>
        <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="flex-1 truncate">{label}</span>
      </button>

      {open && position && (
        <FloatingPanel panelRef={panelRef} position={position} widthOverride={260}>
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setDisplayYear((year) => year - 1)}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Ano anterior"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{displayYear}</span>
            <button
              type="button"
              onClick={() => setDisplayYear((year) => year + 1)}
              disabled={displayYear >= maxYear}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-slate-800"
              aria-label="Próximo ano"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5 p-3">
            {MONTH_LABELS.map((monthLabel, index) => {
              const monthIndex = index + 1
              const isSelected = displayYear === selectedYear && monthIndex === selectedMonthIndex
              const disabled = isMonthDisabled(monthIndex)
              return (
                <button
                  key={monthLabel}
                  type="button"
                  disabled={disabled}
                  aria-current={isSelected}
                  onClick={() => selectMonth(monthIndex)}
                  className={`rounded-lg py-2 text-sm font-medium transition ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : disabled
                        ? 'cursor-not-allowed text-slate-300 dark:text-slate-700'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {monthLabel}
                </button>
              )
            })}
          </div>
        </FloatingPanel>
      )}
    </>
  )
}
