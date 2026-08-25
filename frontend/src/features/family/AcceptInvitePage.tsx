import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { ApiError } from '../../lib/apiClient'
import { useAuthStore } from '../../stores/authStore'
import { acceptInvitation } from './api'

const schema = z.object({
  name: z.string().min(1, 'obrigatório'),
  password: z.string().min(8, 'mínimo 8 caracteres'),
})

type FormValues = z.infer<typeof schema>

export function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (values: FormValues) => acceptInvitation(token!, values.name, values.password),
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
        <h1 className="text-xl font-semibold">Você foi convidado para uma família</h1>
        <p className="text-sm text-slate-500">Crie sua senha para entrar.</p>

        <div>
          <label className="block text-sm font-medium">Seu nome</label>
          <input
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            {...register('name')}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Senha</label>
          <input
            type="password"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            {...register('password')}
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600">
            {mutation.error instanceof ApiError ? mutation.error.message : 'Convite inválido ou expirado'}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded bg-slate-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-slate-50 dark:text-slate-900"
        >
          {mutation.isPending ? 'Entrando…' : 'Aceitar convite e entrar'}
        </button>
      </form>
    </div>
  )
}
