import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Field } from '../../components/ui/Field'
import { inputClass } from '../../components/ui/formStyles'
import { CheckCircleIcon, ShieldIcon } from '../../components/icons'
import { ApiError } from '../../lib/apiClient'
import { disableTwoFactor, enableTwoFactor, getTwoFactorStatus, setupTwoFactor, type TwoFactorSetup } from './twoFactorApi'

function SetupFlow({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient()
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null)
  const [code, setCode] = useState('')

  const setupMutation = useMutation({ mutationFn: setupTwoFactor, onSuccess: setSetup })
  const enableMutation = useMutation({
    mutationFn: () => enableTwoFactor(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', '2fa-status'] })
      onDone()
    },
  })

  if (!setup) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Adicione uma camada extra de segurança: além da senha, você vai precisar de um código gerado por um app
          autenticador (Google Authenticator, Authy, etc.) para entrar.
        </p>
        <div className="flex gap-2">
          <Button type="button" size="sm" loading={setupMutation.isPending} onClick={() => setupMutation.mutate()}>
            Ativar autenticação em duas etapas
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onDone}>
            Cancelar
          </Button>
        </div>
        {setupMutation.isError && <p className="text-sm text-red-600 dark:text-red-400">Não foi possível iniciar a configuração.</p>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Escaneie o QR code com seu app autenticador e digite o código de 6 dígitos gerado para confirmar.
      </p>

      <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50 sm:flex-row sm:items-start">
        <img src={setup.qrCodeDataUri} alt="QR code para configurar o app autenticador" className="h-40 w-40 shrink-0 rounded-lg bg-white p-1.5" />
        <div className="min-w-0 space-y-1.5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Não consegue escanear? Digite manualmente:</p>
          <code className="block break-all rounded-lg bg-white px-2.5 py-1.5 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {setup.secret}
          </code>
        </div>
      </div>

      <Field label="Código de 6 dígitos" htmlFor="mfa-enable-code" error={enableMutation.isError ? 'Código inválido' : undefined}>
        <input
          id="mfa-enable-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          className={`${inputClass} tracking-[0.4em]`}
          placeholder="000000"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
        />
      </Field>

      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={code.length !== 6} loading={enableMutation.isPending} onClick={() => enableMutation.mutate()}>
          Confirmar
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

function DisableFlow({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient()
  const [password, setPassword] = useState('')

  const mutation = useMutation({
    mutationFn: () => disableTwoFactor(password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', '2fa-status'] })
      onDone()
    },
  })

  return (
    <div className="space-y-3">
      <Field
        label="Confirme sua senha para desativar"
        htmlFor="mfa-disable-password"
        error={mutation.isError ? (mutation.error instanceof ApiError ? mutation.error.message : 'Senha inválida') : undefined}
      >
        <input
          id="mfa-disable-password"
          type="password"
          autoComplete="current-password"
          className={inputClass}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>
      <div className="flex gap-2">
        <Button type="button" variant="danger" size="sm" disabled={!password} loading={mutation.isPending} onClick={() => mutation.mutate()}>
          Desativar 2FA
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

export function TwoFactorSection() {
  const [mode, setMode] = useState<'idle' | 'setup' | 'disable'>('idle')
  const { data, isLoading } = useQuery({ queryKey: ['auth', '2fa-status'], queryFn: getTwoFactorStatus })

  return (
    <Card>
      <CardHeader icon={<ShieldIcon />} title="Autenticação em duas etapas" description="Proteja sua conta com um código adicional ao entrar" />
      <CardBody>
        {isLoading && <div className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />}

        {!isLoading && data && mode === 'idle' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            {data.enabled ? (
              <>
                <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                  Ativada
                  <Badge tone="success">Protegida</Badge>
                </span>
                <Button type="button" variant="secondary" size="sm" onClick={() => setMode('disable')}>
                  Desativar
                </Button>
              </>
            ) : (
              <>
                <span className="text-sm text-slate-500 dark:text-slate-400">Desativada</span>
                <Button type="button" size="sm" onClick={() => setMode('setup')}>
                  Ativar
                </Button>
              </>
            )}
          </div>
        )}

        {mode === 'setup' && <SetupFlow onDone={() => setMode('idle')} />}
        {mode === 'disable' && <DisableFlow onDone={() => setMode('idle')} />}
      </CardBody>
    </Card>
  )
}
