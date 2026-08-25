import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sendTestNotification } from './api'
import { getCurrentSubscription, subscribeToPush, unsubscribeFromPush } from './pushSubscription'

export function NotificationsSection() {
  const queryClient = useQueryClient()
  const { data: subscription, isLoading } = useQuery({
    queryKey: ['push-subscription'],
    queryFn: getCurrentSubscription,
  })

  const subscribeMutation = useMutation({
    mutationFn: subscribeToPush,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['push-subscription'] }),
  })

  const unsubscribeMutation = useMutation({
    mutationFn: unsubscribeFromPush,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['push-subscription'] }),
  })

  const testMutation = useMutation({ mutationFn: sendTestNotification })

  if (isLoading || !('serviceWorker' in navigator) || !('PushManager' in window)) return null

  const isSubscribed = !!subscription

  return (
    <section className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
      <h2 className="text-lg font-semibold">Notificações</h2>

      {(subscribeMutation.isError || unsubscribeMutation.isError) && (
        <p className="text-sm text-red-600">Não foi possível alterar as notificações. Verifique a permissão do navegador.</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => (isSubscribed ? unsubscribeMutation.mutate() : subscribeMutation.mutate())}
          disabled={subscribeMutation.isPending || unsubscribeMutation.isPending}
          className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-slate-50 dark:text-slate-900"
        >
          {isSubscribed ? 'Desativar notificações' : 'Ativar notificações'}
        </button>

        {isSubscribed && (
          <button
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-slate-700"
          >
            {testMutation.isPending ? 'Enviando…' : 'Enviar notificação de teste'}
          </button>
        )}
      </div>

      {testMutation.isSuccess && (
        <p className="text-sm text-slate-500">
          {testMutation.data.sent > 0 ? 'Notificação enviada.' : 'Nenhum dispositivo inscrito recebeu o teste.'}
        </p>
      )}
    </section>
  )
}
