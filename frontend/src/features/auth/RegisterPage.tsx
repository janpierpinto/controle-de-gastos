import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ApiError } from '../../lib/apiClient'
import { useAuthStore } from '../../stores/authStore'
import { AuthLayout } from './AuthLayout'
import { register as registerRequest } from './api'

const schema = z.object({
  tenantName: z.string().min(1, 'obrigatório'),
  name: z.string().min(1, 'obrigatório'),
  email: z.string().email('e-mail inválido'),
  password: z.string().min(8, 'mínimo 8 caracteres'),
  acceptedTerms: z.literal(true, { message: 'é necessário aceitar para continuar' }),
})

type FormValues = z.infer<typeof schema>

const inputClass =
  'mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white'
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300'
const errorClass = 'mt-1.5 text-sm text-red-600 dark:text-red-400'

export function RegisterPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: registerRequest,
    onSuccess: (data) => {
      setSession(data)
      navigate('/')
    },
  })

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Criar conta da família</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Leva menos de um minuto para começar.</p>

      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="mt-8 space-y-5" noValidate>
        <div>
          <label htmlFor="tenantName" className={labelClass}>
            Nome da família
          </label>
          <input id="tenantName" className={inputClass} placeholder="Família Silva" {...registerField('tenantName')} />
          {errors.tenantName && <p className={errorClass}>{errors.tenantName.message}</p>}
        </div>

        <div>
          <label htmlFor="name" className={labelClass}>
            Seu nome
          </label>
          <input id="name" autoComplete="name" className={inputClass} {...registerField('name')} />
          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={inputClass}
            placeholder="voce@exemplo.com"
            {...registerField('email')}
          />
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Senha
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className={inputClass}
            placeholder="mínimo 8 caracteres"
            {...registerField('password')}
          />
          {errors.password && <p className={errorClass}>{errors.password.message}</p>}
        </div>

        <div>
          <label className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700"
              {...registerField('acceptedTerms')}
            />
            <span>
              Li e aceito a{' '}
              <Link to="/privacidade" target="_blank" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                Política de Privacidade
              </Link>{' '}
              e os{' '}
              <Link to="/termos" target="_blank" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                Termos de Uso
              </Link>
            </span>
          </label>
          {errors.acceptedTerms && <p className={errorClass}>{errors.acceptedTerms.message}</p>}
        </div>

        {mutation.isError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{mutation.error instanceof ApiError ? mutation.error.message : 'Não foi possível criar a conta. Tente novamente.'}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-950"
        >
          {mutation.isPending && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {mutation.isPending ? 'Criando…' : 'Criar conta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
        Já tem conta?{' '}
        <Link to="/entrar" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}
