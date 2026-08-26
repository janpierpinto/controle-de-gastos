import { useQuery } from '@tanstack/react-query'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { CheckCircleIcon, HistoryIcon, ShieldIcon, SlidersIcon, TrashIcon, UsersIcon } from '../../components/icons'
import { useAuthStore } from '../../stores/authStore'
import { getAuditLog } from './api'

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  success: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  danger: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  info: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
}

const actionConfig: Record<string, { label: string; icon: typeof HistoryIcon; tone: Tone }> = {
  REGISTER: { label: 'Conta criada', icon: UsersIcon, tone: 'info' },
  LOGIN: { label: 'Login', icon: CheckCircleIcon, tone: 'neutral' },
  INVITE_CREATED: { label: 'Convite enviado', icon: UsersIcon, tone: 'info' },
  INVITE_ACCEPTED: { label: 'Convite aceito', icon: CheckCircleIcon, tone: 'success' },
  MEMBER_REMOVED: { label: 'Membro removido', icon: TrashIcon, tone: 'warning' },
  ACCOUNT_DELETED: { label: 'Conta excluída', icon: TrashIcon, tone: 'danger' },
  MFA_ENABLED: { label: 'Autenticação em duas etapas ativada', icon: ShieldIcon, tone: 'success' },
  MFA_DISABLED: { label: 'Autenticação em duas etapas desativada', icon: ShieldIcon, tone: 'warning' },
  TENANT_CURRENCY_UPDATED: { label: 'Moeda da família alterada', icon: SlidersIcon, tone: 'info' },
}

/** Fallback for any action code not yet in actionConfig — "MFA_ENABLED" → "Mfa enabled" instead of a raw SCREAMING_SNAKE_CASE string. */
function formatUnknownAction(action: string) {
  return action
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
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
          {data.slice(0, 20).map((entry) => {
            const config = actionConfig[entry.action]
            const Icon = config?.icon ?? HistoryIcon
            const tone = config?.tone ?? 'neutral'
            return (
              <li key={entry.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${toneClasses[tone]}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-300">
                  {config?.label ?? formatUnknownAction(entry.action)}
                </span>
                <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                  {dateTimeFormatter.format(new Date(entry.occurredAt))}
                </span>
              </li>
            )
          })}
        </ul>
      </CardBody>
    </Card>
  )
}
