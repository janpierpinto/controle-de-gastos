import { useQuery } from '@tanstack/react-query'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
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

  if (isLoading) return null

  const expenses = (transactions?.content ?? []).filter((transaction) => transaction.type === 'EXPENSE')
  if (expenses.length === 0) return null

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
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">Gastos por categoria (mês atual)</h2>
      <div className="h-64 rounded-lg border border-slate-200 p-2 dark:border-slate-800">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => currency.format(Number(value))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
