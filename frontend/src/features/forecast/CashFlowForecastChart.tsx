import { useQuery } from '@tanstack/react-query'
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { TrendingUpIcon } from '../../components/icons'
import { formatBRL } from '../../lib/currency'
import { listForecast } from './api'

const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' })

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  return monthFormatter.format(new Date(year, monthNumber - 1, 1))
}

export function CashFlowForecastChart() {
  const { data: forecast, isLoading } = useQuery({ queryKey: ['forecast'], queryFn: () => listForecast(3) })

  const data = (forecast ?? []).map((item) => ({
    month: formatMonthLabel(item.month),
    Receita: item.projectedIncome,
    Despesas: item.projectedExpense,
    'Contas conhecidas': item.knownBillsTotal,
    Saldo: item.projectedNet,
  }))

  return (
    <Card>
      <CardHeader
        icon={<TrendingUpIcon />}
        title="Previsão de fluxo de caixa"
        description="Projeção com base na média dos últimos 3 meses, mais contas já cadastradas"
      />
      <CardBody>
        {isLoading && <div className="h-72 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />}

        {!isLoading && (
          <div className="h-72 text-slate-600 dark:text-slate-300">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value: number) => formatBRL(value)} width={90} />
                <Tooltip
                  formatter={(value) => formatBRL(Number(value))}
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.92)', border: 'none', borderRadius: 8, color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Receita" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Contas conhecidas" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="Saldo" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
