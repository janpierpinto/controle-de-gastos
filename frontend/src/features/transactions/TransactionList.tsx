import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { EmptyState } from '../../components/ui/EmptyState'
import { InboxIcon, TrashIcon, TrendingDownIcon, TrendingUpIcon, UsersIcon } from '../../components/icons'
import { formatCurrency } from '../../lib/currency'
import { listCategories } from '../categories/api'
import { useCurrency } from '../family/useCurrency'
import { deleteTransaction, listTransactions, type Transaction } from './api'
import { SplitTransactionModal } from './SplitTransactionModal'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export function TransactionList() {
  const currency = useCurrency()
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['transactions'], queryFn: listTransactions })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: listCategories })
  const [splittingTransaction, setSplittingTransaction] = useState<Transaction | null>(null)

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
    },
  })

  if (isLoading) {
    return (
      <ul className="space-y-2" aria-label="Carregando transações">
        {[0, 1, 2].map((key) => (
          <li key={key} className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        ))}
      </ul>
    )
  }

  const transactions = data?.content ?? []
  const categoryById = new Map((categories ?? []).map((category) => [category.id, category]))

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<InboxIcon className="h-6 w-6" />}
        title="Nenhuma transação ainda"
        description="Use o formulário para adicionar a primeira transação da família."
      />
    )
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {transactions.map((transaction) => {
        const category = transaction.categoryId ? categoryById.get(transaction.categoryId) : undefined
        const isIncome = transaction.type === 'INCOME'

        return (
          <li key={transaction.id} className="group flex items-center gap-3 py-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: category?.color ? `${category.color}1a` : isIncome ? '#dcfce7' : '#fee2e2',
                color: category?.color ?? (isIncome ? '#16a34a' : '#dc2626'),
              }}
            >
              {isIncome ? <TrendingUpIcon className="h-5 w-5" /> : <TrendingDownIcon className="h-5 w-5" />}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-900 dark:text-white">{transaction.description}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {dateFormatter.format(new Date(`${transaction.occurredOn}T00:00:00`))}
                {category && ` · ${category.name}`}
              </p>
            </div>

            <span className={`shrink-0 font-semibold ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isIncome ? '+' : '-'}
              {formatCurrency(transaction.amount, currency)}
            </span>

            <button
              onClick={() => setSplittingTransaction(transaction)}
              className="shrink-0 rounded-lg p-2 text-slate-300 opacity-0 transition hover:bg-indigo-50 hover:text-indigo-600 focus-visible:opacity-100 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
              aria-label={`Dividir transação ${transaction.description} entre membros da família`}
              title="Dividir entre membros da família"
            >
              <UsersIcon className="h-4 w-4" />
            </button>

            <button
              onClick={() => deleteMutation.mutate(transaction.id)}
              className="shrink-0 rounded-lg p-2 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
              aria-label={`Excluir transação ${transaction.description}`}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </li>
        )
      })}
      {splittingTransaction && (
        <SplitTransactionModal transaction={splittingTransaction} onClose={() => setSplittingTransaction(null)} />
      )}
    </ul>
  )
}
