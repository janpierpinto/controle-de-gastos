import { Tabs } from '../../components/ui/Tabs'
import { CreditCardIcon, FileTextIcon, PieChartIcon, TargetIcon, TrendingUpIcon, UsersIcon, WalletIcon } from '../../components/icons'
import { JpDigitalLogo } from '../../components/JpDigitalLogo'
import { ThemeToggle } from '../../components/ThemeToggle'
import { BillsSection } from '../bills/BillsSection'
import { BudgetsSection } from '../budgets/BudgetsSection'
import { CreditCardsSection } from '../creditcards/CreditCardsSection'
import { FamilySection } from '../family/FamilySection'
import { GoalsSection } from '../goals/GoalsSection'
import { InsightsPanel } from '../insights/InsightsPanel'
import { NotificationsSection } from '../notifications/NotificationsSection'
import { AuditLogSection } from '../privacy/AuditLogSection'
import { TransactionForm } from '../transactions/TransactionForm'
import { TransactionList } from '../transactions/TransactionList'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { CategoryBreakdownChart } from './CategoryBreakdownChart'
import { StatsOverview } from './StatsOverview'
import { UserMenu } from './UserMenu'

export function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <JpDigitalLogo />
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        <StatsOverview />

        <Tabs
          tabs={[
            {
              id: 'overview',
              label: 'Visão geral',
              icon: <TrendingUpIcon className="h-4 w-4" />,
              content: (
                <div className="space-y-6">
                  <InsightsPanel />
                  <NotificationsSection />
                  <CategoryBreakdownChart />
                </div>
              ),
            },
            {
              id: 'transactions',
              label: 'Transações',
              icon: <WalletIcon className="h-4 w-4" />,
              content: (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr] lg:items-start">
                  <Card>
                    <CardHeader icon={<WalletIcon />} title="Nova transação" />
                    <CardBody>
                      <TransactionForm />
                    </CardBody>
                  </Card>
                  <Card>
                    <CardHeader icon={<WalletIcon />} title="Transações recentes" />
                    <CardBody>
                      <TransactionList />
                    </CardBody>
                  </Card>
                </div>
              ),
            },
            {
              id: 'budgets',
              label: 'Orçamentos',
              icon: <PieChartIcon className="h-4 w-4" />,
              content: <BudgetsSection />,
            },
            {
              id: 'goals',
              label: 'Metas',
              icon: <TargetIcon className="h-4 w-4" />,
              content: <GoalsSection />,
            },
            {
              id: 'cards',
              label: 'Cartões',
              icon: <CreditCardIcon className="h-4 w-4" />,
              content: <CreditCardsSection />,
            },
            {
              id: 'bills',
              label: 'Contas a pagar',
              icon: <FileTextIcon className="h-4 w-4" />,
              content: <BillsSection />,
            },
            {
              id: 'family',
              label: 'Família',
              icon: <UsersIcon className="h-4 w-4" />,
              content: (
                <div className="space-y-6">
                  <FamilySection />
                  <AuditLogSection />
                </div>
              ),
            },
          ]}
        />
      </main>
    </div>
  )
}
