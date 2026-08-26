import { useState } from 'react'
import { FloatingPanel } from '../../components/ui/FloatingPanel'
import { inputClass } from '../../components/ui/formStyles'
import { CheckIcon, ChevronDownIcon } from '../../components/icons'
import { useFloatingPanel } from '../../lib/useFloatingPanel'
import type { MemberRole } from './api'

const INVITABLE_ROLES: MemberRole[] = ['ADMIN', 'MEMBER', 'CHILD']

const ROLE_LABELS: Record<MemberRole, string> = {
  OWNER: 'Responsável',
  ADMIN: 'Administrador',
  MEMBER: 'Membro',
  CHILD: 'Criança',
}

const ROLE_DESCRIPTIONS: Record<MemberRole, string> = {
  OWNER: '',
  ADMIN: 'Pode convidar e remover membros',
  MEMBER: 'Acesso completo às finanças da família',
  CHILD: 'Acesso limitado, sem gerenciar a família',
}

interface RoleSelectProps {
  id: string
  value: MemberRole
  onChange: (value: MemberRole) => void
}

/** Custom role dropdown — not a native <select>, same reasoning as CurrencySelect/CategorySelect. */
export function RoleSelect({ id, value, onChange }: RoleSelectProps) {
  const [open, setOpen] = useState(false)
  const { triggerRef, panelRef, position } = useFloatingPanel(open, () => setOpen(false))

  const select = (role: MemberRole) => {
    onChange(role)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        id={id}
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        className={`${inputClass} flex items-center justify-between gap-2 text-left`}
      >
        <span className="truncate">{ROLE_LABELS[value]}</span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && position && (
        <FloatingPanel panelRef={panelRef} position={position} widthOverride={240}>
          <ul role="listbox" aria-label="Papel" className="max-h-60 overflow-y-auto py-1">
            {INVITABLE_ROLES.map((role) => (
              <li key={role}>
                <button
                  type="button"
                  role="option"
                  aria-selected={role === value}
                  onClick={() => select(role)}
                  className="flex w-full items-start justify-between gap-2 px-3.5 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="min-w-0">
                    <span className="block text-sm text-slate-700 dark:text-slate-200">{ROLE_LABELS[role]}</span>
                    <span className="block text-xs text-slate-400 dark:text-slate-500">{ROLE_DESCRIPTIONS[role]}</span>
                  </span>
                  {role === value && <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />}
                </button>
              </li>
            ))}
          </ul>
        </FloatingPanel>
      )}
    </>
  )
}
