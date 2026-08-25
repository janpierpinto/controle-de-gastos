import type { ReactNode } from 'react'
import { JpDigitalLogo } from '../../components/JpDigitalLogo'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {children}
    </svg>
  )
}

const FEATURES: { icon: ReactNode; title: string; description: string; badge?: string }[] = [
  {
    icon: (
      <Icon>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </Icon>
    ),
    title: 'Transações e orçamentos com alerta',
    description: 'Lance seus gastos, defina limites por categoria e saiba na hora quando estourar o orçamento.',
  },
  {
    icon: (
      <Icon>
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </Icon>
    ),
    title: 'Cartões e contas a pagar',
    description: 'Acompanhe a fatura do mês por cartão e nunca perca a data de vencimento de uma conta.',
  },
  {
    icon: (
      <Icon>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </Icon>
    ),
    title: 'Feito para a família toda',
    description: 'Convide quem divide as contas com você — cada um com seu papel e visão compartilhada.',
  },
  {
    icon: (
      <Icon>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </Icon>
    ),
    title: 'Notificações no celular',
    description: 'Instale como app (PWA) e receba avisos direto na tela, sem precisar abrir o navegador.',
  },
  {
    icon: (
      <Icon>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </Icon>
    ),
    title: 'Seus dados, protegidos',
    description: 'Isolamento reforçado no banco de dados e conformidade com a LGPD, desde o primeiro dia.',
  },
  {
    icon: (
      <Icon>
        <path d="M18 13v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </Icon>
    ),
    title: 'Conecte seu banco',
    description: 'Sincronização automática de transações via Open Finance chegando em breve.',
    badge: 'em breve',
  },
]

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-white md:grid-cols-2 dark:bg-slate-950">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 p-10 text-white md:flex lg:p-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-black/10 blur-3xl" />

        <JpDigitalLogo variant="inverted" className="relative" />

        <div className="relative space-y-10">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-balance lg:text-4xl">Controle financeiro para toda a família</h1>
            <p className="max-w-md text-indigo-100">
              Transações, orçamentos, cartões e contas em um só lugar — feito pela JPDigital para famílias que
              querem ter clareza sobre para onde o dinheiro vai.
            </p>
          </div>

          <ul className="space-y-5">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
                  {feature.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{feature.title}</p>
                    {feature.badge && (
                      <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium text-indigo-100 ring-1 ring-white/20">
                        {feature.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-indigo-100/90">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-indigo-100/70">© {new Date().getFullYear()} JPDigital. Todos os direitos reservados.</p>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 md:hidden">
            <JpDigitalLogo />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
