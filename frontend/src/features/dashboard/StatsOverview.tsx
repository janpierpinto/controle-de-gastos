import { useQuery } from '@tanstack/react-query'
import { Card } from '../../components/ui/Card'
import { AlertCircleIcon, TrendingDownIcon, TrendingUpIcon, WalletIcon } from '../../components/icons'
import { currentMonthEnd, currentMonthStart } from '../../lib/date'
import { listBills } from '../bills/api'
import { listTransactionsByPeriod } from '../transactions/api'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })

function StatCard({
  icon,
  iconTone,
  label,
  value,
  valueTone = 'default',
}: {
  icon: React.ReactNode
  iconTone: string
  label: string
  value: string
  valueTone?: 'default' | 'positive' | 'negative'
}) {
  const valueClass =
    valueTone === 'positive'
      ? 'text-green-600 dark:text-green-400'
      : valueTone === 'negative'
        ? 'text-red-600 dark:text-red-400'
        : 'text-slate-900 dark:text-white'

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconTone}`}>{icon}</span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className={`truncate text-lg font-bold ${valueClass}`}>{value}</p>
        </div>
      </div>
    </Card>
  )
}

export function StatsOverview() {
  const from = currentMonthStart()
  const to = currentMonthEnd()

  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['transactions', 'period', from, to],
    queryFn: () => listTransactionsByPeriod(from, to),
  })
  const { data: bills, isLoading: loadingBills } = useQuery({ queryKey: ['bills'], queryFn: listBills })

  if (loadingTransactions || loadingBills) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <Card key={key} className="h-[72px] animate-pulse p-4" />
        ))}
      </div>
    )
  }

  const items = transactions?.content ?? []
  const income = items.filter((t) => t.type === 'INCOME').reduce((total, t) => total + t.amount, 0)
  const expense = items.filter((t) => t.type === 'EXPENSE').reduce((total, t) => total + t.amount, 0)
  const balance = income - expense

  const nextBill = (bills ?? [])
    .filter((bill) => bill.status === 'PENDING')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        icon={<WalletIcon className="h-5 w-5" />}
        iconTone="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
        label="Saldo do mês"
        value={currency.format(balance)}
        valueTone={balance >= 0 ? 'positive' : 'negative'}
      />
      <StatCard
        icon={<TrendingUpIcon className="h-5 w-5" />}
        iconTone="bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
        label="Receitas"
        value={currency.format(income)}
      />
      <StatCard
        icon={<TrendingDownIcon className="h-5 w-5" />}
        iconTone="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
        label="Gastos"
        value={currency.format(expense)}
      />
      <StatCard
        icon={<AlertCircleIcon className="h-5 w-5" />}
        iconTone="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
        label="Próxima conta"
        value={nextBill ? `${dateFormatter.format(new Date(`${nextBill.dueDate}T00:00:00`))}` : '—'}
      />
    </div>
  )
}
