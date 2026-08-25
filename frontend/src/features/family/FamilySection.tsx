import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field } from '../../components/ui/Field'
import { inputClass } from '../../components/ui/formStyles'
import { PlusIcon, TrashIcon, UsersIcon, XIcon } from '../../components/icons'
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

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/convite/${token}`

  const copy = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
    >
      {copied ? 'Copiado!' : 'Copiar link'}
    </button>
  )
}

export function FamilySection() {
  const currentRole = useAuthStore((state) => state.role)
  const canManage = currentRole === 'OWNER' || currentRole === 'ADMIN'
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: members, isLoading } = useQuery({ queryKey: ['family', 'members'], queryFn: listMembers })
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
      setShowForm(false)
    },
  })

  const removeMutation = useMutation({
    mutationFn: removeMember,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['family', 'members'] }),
  })

  return (
    <Card>
      <CardHeader
        icon={<UsersIcon />}
        title="Família"
        description="Quem compartilha as finanças com você"
        action={
          canManage && (
            <Button type="button" variant={showForm ? 'secondary' : 'primary'} size="sm" onClick={() => setShowForm((value) => !value)}>
              {showForm ? <XIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
              {showForm ? 'Cancelar' : 'Convidar'}
            </Button>
          )
        }
      />

      <CardBody className="space-y-4">
        {showForm && (
          <form
            onSubmit={handleSubmit((values) => inviteMutation.mutate(values))}
            className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end dark:border-slate-800 dark:bg-slate-950/50"
          >
            <Field label="E-mail do convidado" htmlFor="invite-email" error={errors.email?.message}>
              <input id="invite-email" type="email" className={inputClass} placeholder="pessoa@exemplo.com" {...register('email')} />
            </Field>
            <Field label="Papel" htmlFor="invite-role" className="sm:w-40">
              <select id="invite-role" className={inputClass} {...register('role')}>
                <option value="ADMIN">Administrador</option>
                <option value="MEMBER">Membro</option>
                <option value="CHILD">Criança</option>
              </select>
            </Field>
            <Button type="submit" loading={inviteMutation.isPending}>
              Convidar
            </Button>
          </form>
        )}

        {isLoading && (
          <div className="space-y-2">
            {[0, 1].map((key) => (
              <div key={key} className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        )}

        {members && members.length > 0 && (
          <ul className="space-y-2">
            {members.map((member) => (
              <li key={member.id} className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                  {initials(member.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900 dark:text-white">{member.name}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                </div>
                <Badge tone={member.role === 'OWNER' ? 'info' : 'neutral'}>{roleLabels[member.role]}</Badge>
                {canManage && member.role !== 'OWNER' && (
                  <button
                    onClick={() => removeMutation.mutate(member.id)}
                    className="rounded-lg p-2 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    aria-label={`Remover ${member.name}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {members && members.length === 0 && !isLoading && (
          <EmptyState icon={<UsersIcon className="h-6 w-6" />} title="Só você por aqui" description="Convide alguém para compartilhar as finanças da família." />
        )}

        {canManage && invitations && invitations.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium tracking-wide text-slate-400 uppercase dark:text-slate-500">Convites pendentes</p>
            <ul className="space-y-2">
              {invitations.map((invitation) => (
                <li
                  key={invitation.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 p-3 text-sm dark:border-slate-700"
                >
                  <span className="min-w-0 truncate">
                    <strong className="text-slate-900 dark:text-white">{invitation.email}</strong>{' '}
                    <span className="text-slate-500 dark:text-slate-400">({roleLabels[invitation.role]})</span>
                  </span>
                  <CopyLinkButton token={invitation.token} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
