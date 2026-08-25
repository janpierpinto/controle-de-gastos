import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDownIcon, LogOutIcon, ShieldIcon } from '../../components/icons'
import { useAuthStore } from '../../stores/authStore'

const roleLabels: Record<string, string> = {
  OWNER: 'Responsável',
  ADMIN: 'Administrador',
  MEMBER: 'Membro',
  CHILD: 'Criança',
}

export function UserMenu() {
  const { role, clearSession } = useAuthStore()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg py-1.5 pr-1 pl-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
          {(role ?? '?')[0]}
        </span>
        <span className="hidden text-sm font-medium text-slate-700 sm:block dark:text-slate-200">
          {role ? (roleLabels[role] ?? role) : ''}
        </span>
        <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900"
        >
          <Link
            to="/meus-dados"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ShieldIcon className="h-4 w-4 text-slate-400" />
            Meus dados
          </Link>
          <button
            role="menuitem"
            onClick={clearSession}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <LogOutIcon className="h-4 w-4" />
            Sair
          </button>
        </div>
      )}
    </div>
  )
}
