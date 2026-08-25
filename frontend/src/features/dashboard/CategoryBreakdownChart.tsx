import { useQuery } from '@tanstack/react-query'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PieChartIcon } from '../../components/icons'
import { currentMonthEnd, currentMonthStart } from '../../lib/date'
import { listCategories } from '../categories/api'
import { listTransactionsByPeriod } from '../transactions/api'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const FALLBACK_COLOR = '#64748b'

export function CategoryBreakdownChart() {
  const from = currentMonthStart()
  const to = currentMonthEnd()

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: listCategories })
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', 'period', from, to],
    queryFn: () => listTransactionsByPeriod(from, to),
  })

  const expenses = (transactions?.content ?? []).filter((transaction) => transaction.type === 'EXPENSE')

  const totalsByCategory = new Map<string, number>()
  for (const expense of expenses) {
    const key = expense.categoryId ?? 'sem-categoria'
    totalsByCategory.set(key, (totalsByCategory.get(key) ?? 0) + expense.amount)
  }

  const categoryById = new Map((categories ?? []).map((category) => [category.id, category]))
  const data = Array.from(totalsByCategory.entries())
    .map(([categoryId, total]) => ({
      name: categoryById.get(categoryId)?.name ?? 'Sem categoria',
      value: total,
      color: categoryById.get(categoryId)?.color ?? FALLBACK_COLOR,
    }))
    .sort((a, b) => b.value - a.value)

  return (
    <Card>
      <CardHeader icon={<PieChartIcon />} title="Gastos por categoria" description="Mês atual" />
      <CardBody>
        {isLoading && <div className="h-64 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />}

        {!isLoading && data.length === 0 && (
          <EmptyState
            icon={<PieChartIcon className="h-6 w-6" />}
            title="Sem gastos este mês"
            description="Assim que você registrar uma despesa, o gráfico aparece aqui."
          />
        )}

        {!isLoading && data.length > 0 && (
          <div className="h-64 text-slate-600 dark:text-slate-300">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => currency.format(Number(value))}
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.92)', border: 'none', borderRadius: 8, color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
