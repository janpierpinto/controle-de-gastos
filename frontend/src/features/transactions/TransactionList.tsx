import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteTransaction, listTransactions } from './api'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export function TransactionList() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['transactions'], queryFn: listTransactions })

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })

  if (isLoading) return <p className="text-sm text-slate-500">Carregando…</p>

  const transactions = data?.content ?? []
  const balance = transactions.reduce(
    (total, transaction) => total + (transaction.type === 'INCOME' ? transaction.amount : -transaction.amount),
    0,
  )

  if (transactions.length === 0) {
    return <p className="text-sm text-slate-500">Nenhuma transação ainda. Adicione a primeira acima.</p>
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Saldo do período:{' '}
        <span className={balance >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>
          {currency.format(balance)}
        </span>
      </p>

      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {transactions.map((transaction) => (
          <li key={transaction.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium">{transaction.description}</p>
              <p className="text-xs text-slate-500">{dateFormatter.format(new Date(`${transaction.occurredOn}T00:00:00`))}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                {transaction.type === 'INCOME' ? '+' : '-'}
                {currency.format(transaction.amount)}
              </span>
              <button
                onClick={() => deleteMutation.mutate(transaction.id)}
                className="text-xs text-slate-400 hover:text-red-600"
                aria-label="Excluir transação"
              >
                remover
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
