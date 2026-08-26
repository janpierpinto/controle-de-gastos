import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { SimpleSelect } from '../../components/ui/SimpleSelect'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HistoryIcon,
  ShieldIcon,
  SlidersIcon,
  TrashIcon,
  UsersIcon,
} from '../../components/icons'
import { useAuthStore } from '../../stores/authStore'
import { getAuditLog } from './api'

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

const PAGE_SIZE_OPTIONS = [
  { value: '10', label: '10 por página' },
  { value: '20', label: '20 por página' },
  { value: '50', label: '50 por página' },
  { value: '100', label: '100 por página' },
]

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
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)

  const { data, isLoading } = useQuery({
    queryKey: ['privacy', 'audit-log', page, size],
    queryFn: () => getAuditLog(page, size),
    enabled: canView,
    placeholderData: (previous) => previous,
  })

  if (!canView || (!isLoading && (!data || data.page.totalElements === 0))) return null

  const totalPages = data?.page.totalPages ?? 1
  const totalElements = data?.page.totalElements ?? 0
  const rangeStart = totalElements === 0 ? 0 : page * size + 1
  const rangeEnd = Math.min(totalElements, (page + 1) * size)

  const changePageSize = (value: string) => {
    setSize(Number(value))
    setPage(0)
  }

  return (
    <Card>
      <CardHeader icon={<HistoryIcon />} title="Histórico de segurança" description="Últimos eventos da conta e da família" />
      <CardBody className="p-0">
        {isLoading && !data && (
          <div className="space-y-2 p-5">
            {[0, 1, 2].map((key) => (
              <div key={key} className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        )}

        {data && (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.content.map((entry) => {
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
        )}

        {data && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {rangeStart}–{rangeEnd} de {totalElements}
            </p>
            <div className="flex items-center gap-2">
              <div className="w-40">
                <SimpleSelect id="audit-log-page-size" value={String(size)} onChange={changePageSize} options={PAGE_SIZE_OPTIONS} />
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={page === 0}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-slate-800"
                  aria-label="Página anterior"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <span className="min-w-16 text-center text-xs text-slate-500 dark:text-slate-400">
                  {page + 1} de {Math.max(1, totalPages)}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-slate-800"
                  aria-label="Próxima página"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
