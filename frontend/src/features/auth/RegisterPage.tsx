import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ApiError } from '../../lib/apiClient'
import { useAuthStore } from '../../stores/authStore'
import { register as registerRequest } from './api'

const schema = z.object({
  tenantName: z.string().min(1, 'obrigatório'),
  name: z.string().min(1, 'obrigatório'),
  email: z.string().email('e-mail inválido'),
  password: z.string().min(8, 'mínimo 8 caracteres'),
})

type FormValues = z.infer<typeof schema>

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
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 p-6 dark:border-slate-800"
      >
        <h1 className="text-xl font-semibold">Criar conta da família</h1>

        <div>
          <label className="block text-sm font-medium">Nome da família</label>
          <input
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            placeholder="Família Silva"
            {...registerField('tenantName')}
          />
          {errors.tenantName && <p className="mt-1 text-sm text-red-600">{errors.tenantName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Seu nome</label>
          <input
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            {...registerField('name')}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">E-mail</label>
          <input
            type="email"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            {...registerField('email')}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Senha</label>
          <input
            type="password"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            {...registerField('password')}
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600">
            {mutation.error instanceof ApiError ? mutation.error.message : 'Falha ao criar conta'}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded bg-slate-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-slate-50 dark:text-slate-900"
        >
          {mutation.isPending ? 'Criando…' : 'Criar conta'}
        </button>

        <p className="text-sm">
          Já tem conta?{' '}
          <Link to="/entrar" className="underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  )
}
