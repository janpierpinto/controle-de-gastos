interface JpDigitalLogoProps {
  className?: string
  variant?: 'default' | 'inverted'
}

export function JpDigitalLogo({ className = '', variant = 'default' }: JpDigitalLogoProps) {
  const textPrimary = variant === 'inverted' ? 'text-white' : 'text-slate-900 dark:text-white'
  const textAccent = variant === 'inverted' ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400'
  const iconWrap =
    variant === 'inverted'
      ? 'bg-white/15 text-white ring-1 ring-white/30'
      : 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30'

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconWrap}`}>
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      </span>
      <span className="text-lg font-bold tracking-tight">
        <span className={textPrimary}>JP</span>
        <span className={textAccent}>Digital</span>
      </span>
    </div>
  )
}
