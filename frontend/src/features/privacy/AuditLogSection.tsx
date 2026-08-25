import { useQuery } from '@tanstack/react-query'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { HistoryIcon } from '../../components/icons'
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
    <Card>
      <CardHeader icon={<HistoryIcon />} title="Histórico de segurança" description="Últimos eventos da conta e da família" />
      <CardBody className="p-0">
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {data.slice(0, 20).map((entry) => (
            <li key={entry.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
              <span className="text-slate-700 dark:text-slate-300">{actionLabels[entry.action] ?? entry.action}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">{dateTimeFormatter.format(new Date(entry.occurredAt))}</span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}
