import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useAuthStore } from '../../stores/authStore'
import { createInvitation, listInvitations, listMembers, removeMember, type MemberRole } from './api'

const schema = z.object({
  email: z.string().email('e-mail inválido'),
  role: z.enum(['ADMIN', 'MEMBER', 'CHILD']),
})

type FormValues = z.infer<typeof schema>

const roleLabels: Record<MemberRole, string> = {
  OWNER: 'Responsável',
  ADMIN: 'Administrador',
  MEMBER: 'Membro',
  CHILD: 'Criança',
}

export function FamilySection() {
  const currentRole = useAuthStore((state) => state.role)
  const canManage = currentRole === 'OWNER' || currentRole === 'ADMIN'
  const queryClient = useQueryClient()

  const { data: members } = useQuery({ queryKey: ['family', 'members'], queryFn: listMembers })
  const { data: invitations } = useQuery({
    queryKey: ['family', 'invitations'],
    queryFn: listInvitations,
    enabled: canManage,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', role: 'MEMBER' } })

  const inviteMutation = useMutation({
    mutationFn: (values: FormValues) => createInvitation(values.email, values.role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family', 'invitations'] })
      reset({ email: '', role: 'MEMBER' })
    },
  })

  const removeMutation = useMutation({
    mutationFn: removeMember,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['family', 'members'] }),
  })

  const inviteLink = (token: string) => `${window.location.origin}/convite/${token}`

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Família</h2>

      {members && (
        <ul className="space-y-2">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800"
            >
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-xs text-slate-500">
                  {member.email} · {roleLabels[member.role]}
                </p>
              </div>
              {canManage && member.role !== 'OWNER' && (
                <button
                  onClick={() => removeMutation.mutate(member.id)}
                  className="text-xs text-slate-400 hover:text-red-600"
                >
                  remover
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && invitations && invitations.length > 0 && (
        <ul className="space-y-1">
          {invitations.map((invitation) => (
            <li key={invitation.id} className="rounded border border-dashed border-slate-300 p-2 text-xs dark:border-slate-700">
              <p>
                Convite pendente para <strong>{invitation.email}</strong> ({roleLabels[invitation.role]})
              </p>
              <p className="truncate text-slate-500">{inviteLink(invitation.token)}</p>
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <form
          onSubmit={handleSubmit((values) => inviteMutation.mutate(values))}
          className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800"
        >
          <div>
            <label className="block text-xs font-medium">E-mail</label>
            <input
              type="email"
              className="mt-1 w-48 rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              {...register('email')}
            />
          </div>
          <div>
            <label className="block text-xs font-medium">Papel</label>
            <select
              className="mt-1 rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              {...register('role')}
            >
              <option value="ADMIN">Administrador</option>
              <option value="MEMBER">Membro</option>
              <option value="CHILD">Criança</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={inviteMutation.isPending}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-slate-50 dark:text-slate-900"
          >
            Convidar
          </button>
          {errors.email && <p className="w-full text-xs text-red-600">{errors.email.message}</p>}
        </form>
      )}
    </section>
  )
}
