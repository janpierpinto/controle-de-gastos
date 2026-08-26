import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { CurrencyInput } from '../../components/ui/CurrencyInput'
import { checkboxClass, inputClass } from '../../components/ui/formStyles'
import { Modal } from '../../components/ui/Modal'
import { formatCurrency } from '../../lib/currency'
import { initials } from '../../lib/initials'
import { listMembers } from '../family/api'
import { useCurrency } from '../family/useCurrency'
import { clearSplits, listSplits, setSplits, type Transaction } from './api'

export function SplitTransactionModal({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) {
  const currency = useCurrency()
  const queryClient = useQueryClient()
  const { data: members } = useQuery({ queryKey: ['family', 'members'], queryFn: listMembers })
  const { data: existingSplits } = useQuery({
    queryKey: ['transaction-splits', transaction.id],
    queryFn: () => listSplits(transaction.id),
  })

  const [amounts, setAmounts] = useState<Record<string, number>>({})
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (initialized || !existingSplits) return
    if (existingSplits.length > 0) {
      setAmounts(Object.fromEntries(existingSplits.map((split) => [split.tenantMemberId, split.amount])))
    }
    setInitialized(true)
  }, [existingSplits, initialized])

  const selectedIds = Object.keys(amounts)
  const totalCents = Math.round(transaction.amount * 100)
  const enteredCents = selectedIds.reduce((sum, id) => sum + Math.round((amounts[id] ?? 0) * 100), 0)
  const remainderCents = totalCents - enteredCents
  const balanced = selectedIds.length > 0 && remainderCents === 0

  const toggleMember = (memberId: string) => {
    setAmounts((current) => {
      const next = { ...current }
      if (memberId in next) {
        delete next[memberId]
      } else {
        next[memberId] = 0
      }
      return next
    })
  }

  const splitEqually = () => {
    const ids = selectedIds.length > 0 ? selectedIds : (members ?? []).map((member) => member.id)
    if (ids.length === 0) return
    const base = Math.floor(totalCents / ids.length)
    const remainder = totalCents - base * ids.length
    const next: Record<string, number> = {}
    ids.forEach((id, index) => {
      next[id] = (base + (index < remainder ? 1 : 0)) / 100
    })
    setAmounts(next)
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      setSplits(
        transaction.id,
        selectedIds.map((id) => ({ tenantMemberId: id, amount: amounts[id] })),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-splits', transaction.id] })
      onClose()
    },
  })

  const clearMutation = useMutation({
    mutationFn: () => clearSplits(transaction.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-splits', transaction.id] })
      onClose()
    },
  })

  return (
    <Modal title="Dividir despesa" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">{transaction.description}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{formatCurrency(transaction.amount, currency)}</p>
        </div>

        <div className="max-h-64 space-y-2 overflow-y-auto">
          {(members ?? []).map((member) => {
            const checked = member.id in amounts
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 p-2.5 dark:border-slate-800"
              >
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={checked}
                  onChange={() => toggleMember(member.id)}
                  aria-label={`Incluir ${member.name} na divisão`}
                />
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                  {initials(member.name)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200">{member.name}</span>
                <CurrencyInput
                  id={`split-amount-${member.id}`}
                  value={amounts[member.id] ?? 0}
                  onChange={(value) => setAmounts((current) => ({ ...current, [member.id]: value }))}
                  className={`${inputClass} w-32 py-1.5`}
                  aria-label={`Valor de ${member.name}`}
                  disabled={!checked}
                  currency={currency}
                />
              </div>
            )
          })}
          {members && members.length === 0 && (
            <p className="py-2 text-sm text-slate-400 dark:text-slate-500">Convide membros da família para dividir despesas.</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={splitEqually}
            className="text-sm font-medium text-indigo-600 transition hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Dividir igualmente
          </button>
          <p className={`text-sm ${balanced ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
            {balanced
              ? 'Valores batem'
              : remainderCents > 0
                ? `Faltam ${formatCurrency(remainderCents / 100, currency)}`
                : `Excede em ${formatCurrency(Math.abs(remainderCents) / 100, currency)}`}
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          {existingSplits && existingSplits.length > 0 && (
            <Button type="button" variant="danger" size="sm" loading={clearMutation.isPending} onClick={() => clearMutation.mutate()}>
              Remover divisão
            </Button>
          )}
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" size="sm" disabled={!balanced} loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            Salvar divisão
          </Button>
        </div>
      </div>
    </Modal>
  )
}
