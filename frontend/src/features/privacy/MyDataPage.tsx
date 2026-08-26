import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { AlertCircleIcon, DownloadIcon, TrashIcon, UsersIcon } from '../../components/icons'
import { JpDigitalLogo } from '../../components/JpDigitalLogo'
import { useAuthStore } from '../../stores/authStore'
import { TwoFactorSection } from './TwoFactorSection'
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <JpDigitalLogo />
          <Link
            to="/"
            className="text-sm font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
          >
            ← Voltar ao painel
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Meus dados</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Suas informações, segurança da conta e direitos garantidos pela LGPD.</p>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[0, 1, 2].map((key) => (
              <div key={key} className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        )}

        {data && (
          <>
            <Card>
              <CardHeader title="Perfil" description="Suas informações básicas de cadastro" />
              <CardBody className="space-y-2 text-sm">
                <p className="text-slate-700 dark:text-slate-200">
                  <span className="text-slate-500 dark:text-slate-400">Nome:</span> {data.name}
                </p>
                <p className="text-slate-700 dark:text-slate-200">
                  <span className="text-slate-500 dark:text-slate-400">E-mail:</span> {data.email}
                </p>
                <p className="text-slate-700 dark:text-slate-200">
                  <span className="text-slate-500 dark:text-slate-400">Conta criada em:</span>{' '}
                  {dateFormatter.format(new Date(data.createdAt))}
                </p>
              </CardBody>
            </Card>

            <TwoFactorSection />

            <Card>
              <CardHeader icon={<UsersIcon />} title="Famílias" description="Tenants aos quais você pertence" />
              <CardBody>
                <ul className="space-y-2">
                  {data.memberships.map((membership) => (
                    <li key={membership.tenantId} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700 dark:text-slate-200">{membership.tenantName}</span>
                      <Badge tone="info">{membership.role}</Badge>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>

            <Card>
              <CardHeader icon={<DownloadIcon />} title="Portabilidade" description="Baixe uma cópia de todos os seus dados" />
              <CardBody>
                <Button type="button" variant="secondary" size="sm" onClick={downloadJson}>
                  <DownloadIcon className="h-4 w-4" /> Baixar meus dados (JSON)
                </Button>
              </CardBody>
            </Card>

            <Card>
              <CardHeader icon={<AlertCircleIcon />} title="Excluir minha conta" description="Essa ação não pode ser desfeita" />
              <CardBody className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Sua conta será desativada e seu e-mail removido do sistema. Transações compartilhadas com outros
                  membros da família continuam visíveis para eles, sem identificar você.
                </p>
                {!confirming ? (
                  <Button type="button" variant="danger" size="sm" onClick={() => setConfirming(true)}>
                    <TrashIcon className="h-4 w-4" /> Quero excluir minha conta
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="danger" size="sm" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
                      Confirmar exclusão
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setConfirming(false)}>
                      Cancelar
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
