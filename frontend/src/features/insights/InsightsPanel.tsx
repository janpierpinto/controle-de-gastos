import { useQuery } from '@tanstack/react-query'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import {
  AlertCircleIcon,
  CheckCircleIcon,
  FileTextIcon,
  HistoryIcon,
  LightbulbIcon,
  PieChartIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from '../../components/icons'
import { listInsights, type Insight, type InsightSeverity, type InsightType } from './api'

const typeIcon: Record<InsightType, typeof PieChartIcon> = {
  BUDGET_ALERT: PieChartIcon,
  UPCOMING_BILL: FileTextIcon,
  MONTH_COMPARISON: TrendingUpIcon,
  RECURRING_DETECTED: HistoryIcon,
  ANOMALY_DETECTED: AlertCircleIcon,
}

const severityStyle: Record<InsightSeverity, { icon: typeof AlertCircleIcon; iconTone: string; badge: string }> = {
  DANGER: {
    icon: AlertCircleIcon,
    iconTone: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
    badge: 'border-red-200 dark:border-red-900/50',
  },
  WARNING: {
    icon: AlertCircleIcon,
    iconTone: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    badge: 'border-amber-200 dark:border-amber-900/50',
  },
  INFO: {
    icon: HistoryIcon,
    iconTone: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
    badge: 'border-indigo-200 dark:border-indigo-900/50',
  },
  SUCCESS: {
    icon: CheckCircleIcon,
    iconTone: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400',
    badge: 'border-green-200 dark:border-green-900/50',
  },
}

function InsightIcon({ insight }: { insight: Insight }) {
  if (insight.type === 'MONTH_COMPARISON') {
    const Icon = insight.severity === 'SUCCESS' ? TrendingDownIcon : TrendingUpIcon
    return <Icon className="h-5 w-5" />
  }
  const Icon = typeIcon[insight.type]
  return <Icon className="h-5 w-5" />
}

export function InsightsPanel() {
  const { data: insights, isLoading } = useQuery({ queryKey: ['insights'], queryFn: listInsights })

  return (
    <Card>
      <CardHeader icon={<LightbulbIcon />} title="Insights" description="Alertas e sugestões geradas a partir dos seus dados" />
      <CardBody>
        {isLoading && (
          <div className="space-y-2">
            {[0, 1, 2].map((key) => (
              <div key={key} className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        )}

        {!isLoading && (!insights || insights.length === 0) && (
          <EmptyState
            icon={<CheckCircleIcon className="h-6 w-6" />}
            title="Tudo em ordem por aqui"
            description="Assim que houver algo relevante — um orçamento perto do limite, uma conta a vencer ou um padrão de gasto — ele aparece aqui."
          />
        )}

        {insights && insights.length > 0 && (
          <ul className="space-y-2.5">
            {insights.map((insight, index) => {
              const style = severityStyle[insight.severity]
              return (
                <li
                  key={index}
                  className={`flex gap-3 rounded-xl border p-3.5 ${style.badge}`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.iconTone}`}>
                    <InsightIcon insight={insight} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white">{insight.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{insight.description}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
