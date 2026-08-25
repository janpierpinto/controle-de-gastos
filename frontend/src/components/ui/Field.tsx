import type { ReactNode } from 'react'
import { errorClass, labelClass } from './formStyles'

export function Field({
  label,
  htmlFor,
  error,
  children,
  className = '',
}: {
  label: string
  htmlFor: string
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error && <p className={errorClass}>{error}</p>}
    </div>
  )
}
