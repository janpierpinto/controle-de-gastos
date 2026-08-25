import { BillsSection } from '../bills/BillsSection'
import { BudgetsSection } from '../budgets/BudgetsSection'
import { CreditCardsSection } from '../creditcards/CreditCardsSection'
import { FamilySection } from '../family/FamilySection'
import { NotificationsSection } from '../notifications/NotificationsSection'
import { AuditLogSection } from '../privacy/AuditLogSection'
import { TransactionForm } from '../transactions/TransactionForm'
import { TransactionList } from '../transactions/TransactionList'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useThemeStore } from '../../stores/themeStore'
import { CategoryBreakdownChart } from './CategoryBreakdownChart'

export function DashboardPage() {
  const { role, clearSession } = useAuthStore()
  const { theme, toggle } = useThemeStore()

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Painel</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500">{role}</span>
          <Link to="/meus-dados" className="underline">
            Meus dados
          </Link>
          <button onClick={toggle} aria-label="Alternar tema" className="text-lg">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={clearSession} className="underline">
            Sair
          </button>
        </div>
      </div>

      <NotificationsSection />
      <CategoryBreakdownChart />
      <BillsSection />
      <CreditCardsSection />
      <BudgetsSection />
      <TransactionForm />
      <TransactionList />
      <FamilySection />
      <AuditLogSection />
    </div>
  )
}
