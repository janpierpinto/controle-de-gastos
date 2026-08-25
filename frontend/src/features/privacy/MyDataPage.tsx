import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { deleteMyAccount, getMyData } from './api'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export function MyDataPage() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((state) => state.clearSession)
  const [confirming, setConfirming] = useState(false)

  const { data, isLoading } = useQuery({ queryKey: ['privacy', 'my-data'], queryFn: getMyData })

  const deleteMutation = useMutation({
    mutationFn: deleteMyAccount,
    onSuccess: () => {
      clearSession()
      navigate('/entrar')
    },
  })

  const downloadJson = () => {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'meus-dados.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Link to="/" className="text-sm underline">
        ← Voltar
      </Link>
      <h1 className="text-2xl font-semibold">Meus dados</h1>

      {isLoading && <p className="text-sm text-slate-500">Carregando…</p>}

      {data && (
        <>
          <div className="rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-800">
            <p>
              <strong>Nome:</strong> {data.name}
            </p>
            <p>
              <strong>E-mail:</strong> {data.email}
            </p>
            <p>
              <strong>Conta criada em:</strong> {dateFormatter.format(new Date(data.createdAt))}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Famílias</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {data.memberships.map((membership) => (
                <li key={membership.tenantId}>
                  {membership.tenantName} — {membership.role}
                </li>
              ))}
            </ul>
          </div>

          <button onClick={downloadJson} className="rounded border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700">
            Baixar meus dados (JSON)
          </button>

          <div className="rounded-lg border border-red-300 p-4 dark:border-red-900">
            <h2 className="text-base font-semibold text-red-600">Excluir minha conta</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Sua conta será desativada e seu e-mail removido do sistema. Transações compartilhadas com outros
              membros da família continuam visíveis para eles, sem identificar você.
            </p>
            {!confirming ? (
              <button onClick={() => setConfirming(true)} className="mt-3 text-sm text-red-600 underline">
                Quero excluir minha conta
              </button>
            ) : (
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="rounded bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Excluindo…' : 'Confirmar exclusão'}
                </button>
                <button onClick={() => setConfirming(false)} className="text-sm underline">
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
