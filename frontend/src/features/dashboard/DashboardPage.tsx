import { useAuthStore } from '../../stores/authStore'

export function DashboardPage() {
  const { role, clearSession } = useAuthStore()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Painel</h1>
        <button onClick={clearSession} className="text-sm underline">
          Sair
        </button>
      </div>
      <p className="mt-4 text-slate-600 dark:text-slate-400">
        Logado como <strong>{role}</strong>. Transações, orçamentos e conexão com Open Finance chegam na Fase 1/2 do
        roadmap.
      </p>
    </div>
  )
}
