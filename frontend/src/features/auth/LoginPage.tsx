import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuthStore } from '../../stores/authStore'
import { ApiError } from '../../lib/apiClient'
import { AuthLayout } from './AuthLayout'
import { assertTokens, login, verifyMfa } from './api'

const schema = z.object({
  email: z.string().email('e-mail inválido'),
  password: z.string().min(1, 'obrigatório'),
})

type FormValues = z.infer<typeof schema>

const inputClass =
  'mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white'
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300'

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{message}</span>
    </div>
  )
}

function SubmitButton({ pending, idleLabel, pendingLabel }: { pending: boolean; idleLabel: string; pendingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-950"
    >
      {pending && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {pending ? pendingLabel : idleLabel}
    </button>
  )
}

function MfaStep({ mfaToken, onBack }: { mfaToken: string; onBack: () => void }) {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const [code, setCode] = useState('')

  const mutation = useMutation({
    mutationFn: () => verifyMfa({ mfaToken, code }),
    onSuccess: (data) => {
      setSession(assertTokens(data))
      navigate('/')
    },
  })

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Verificação em duas etapas</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Digite o código de 6 dígitos do seu app autenticador.</p>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate()
        }}
        className="mt-8 space-y-5"
      >
        <div>
          <label htmlFor="mfa-code" className={labelClass}>
            Código de verificação
          </label>
          <input
            id="mfa-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            className={`${inputClass} text-center tracking-[0.5em]`}
            placeholder="000000"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          />
        </div>

        {mutation.isError && (
          <ErrorBanner message={mutation.error instanceof ApiError ? mutation.error.message : 'Código inválido. Tente novamente.'} />
        )}

        <SubmitButton pending={mutation.isPending} idleLabel="Verificar" pendingLabel="Verificando…" />
      </form>

      <button
        type="button"
        onClick={onBack}
        className="mt-6 w-full text-center text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
      >
        ← Voltar
      </button>
    </>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const [mfaToken, setMfaToken] = useState<string | null>(null)

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      if (data.mfaRequired && data.mfaToken) {
        setMfaToken(data.mfaToken)
        return
      }
      setSession(assertTokens(data))
      navigate('/')
    },
  })

  if (mfaToken) {
    return (
      <AuthLayout>
        <MfaStep mfaToken={mfaToken} onBack={() => setMfaToken(null)} />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bem-vindo de volta</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Entre para continuar controlando seus gastos.</p>

      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="mt-8 space-y-5" noValidate>
        <div>
          <label htmlFor="email" className={labelClass}>
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={inputClass}
            placeholder="voce@exemplo.com"
            {...registerField('email')}
          />
          {errors.email && (
            <p id="email-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className={labelClass}>
              Senha
            </label>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className={inputClass}
            placeholder="••••••••"
            {...registerField('password')}
          />
          {errors.password && (
            <p id="password-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        {mutation.isError && (
          <ErrorBanner message={mutation.error instanceof ApiError ? mutation.error.message : 'Não foi possível entrar. Tente novamente.'} />
        )}

        <SubmitButton pending={mutation.isPending} idleLabel="Entrar" pendingLabel="Entrando…" />
      </form>

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
        Não tem conta?{' '}
        <Link to="/registrar" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          Criar conta da família
        </Link>
      </p>
    </AuthLayout>
  )
}
