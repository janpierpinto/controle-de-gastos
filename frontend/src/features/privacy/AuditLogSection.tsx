import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/authStore'
import { getAuditLog } from './api'

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

const actionLabels: Record<string, string> = {
  REGISTER: 'Conta criada',
  LOGIN: 'Login',
  INVITE_CREATED: 'Convite enviado',
  INVITE_ACCEPTED: 'Convite aceito',
  MEMBER_REMOVED: 'Membro removido',
  ACCOUNT_DELETED: 'Conta excluída',
}

export function AuditLogSection() {
  const role = useAuthStore((state) => state.role)
  const canView = role === 'OWNER' || role === 'ADMIN'

  const { data } = useQuery({ queryKey: ['privacy', 'audit-log'], queryFn: getAuditLog, enabled: canView })

  if (!canView || !data || data.length === 0) return null

  return (
    <details className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
      <summary className="cursor-pointer font-medium">Histórico de segurança</summary>
      <ul className="mt-2 space-y-1 text-xs text-slate-500">
        {data.slice(0, 20).map((entry) => (
          <li key={entry.id}>
            {dateTimeFormatter.format(new Date(entry.occurredAt))} — {actionLabels[entry.action] ?? entry.action}
          </li>
        ))}
      </ul>
    </details>
  )
}
