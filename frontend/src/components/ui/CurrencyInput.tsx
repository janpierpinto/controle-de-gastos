import type { ChangeEvent } from 'react'
import { formatCentsAsDecimal } from '../../lib/currency'
import { inputClass } from './formStyles'

interface CurrencyInputProps {
  id: string
  value: number | undefined
  onChange: (value: number) => void
  onBlur?: () => void
  placeholder?: string
  className?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

/**
 * Digits-in, formatted-out money input (like a calculator/ATM): typing
 * "150000" renders "1.500,00" as you go, backspace removes the last digit.
 * Fully controlled off a numeric `value` (reais) — no internal state — so
 * it stays in sync with whatever react-hook-form's Controller passes in
 * (including reset() calls) without a separate sync effect.
 */
export function CurrencyInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder = '0,00',
  className = '',
  ...aria
}: CurrencyInputProps) {
  const digits = value ? Math.round(value * 100).toString() : ''
  const display = digits === '' ? '' : formatCentsAsDecimal(digits)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const rawDigits = event.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
    onChange(rawDigits === '' ? 0 : parseInt(rawDigits, 10) / 100)
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-slate-400">R$</span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={display}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`${className || inputClass} pl-10`}
        {...aria}
      />
    </div>
  )
}
