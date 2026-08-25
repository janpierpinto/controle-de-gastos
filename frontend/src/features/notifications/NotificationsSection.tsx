import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { BellIcon } from '../../components/icons'
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
    <div className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-indigo-500/20 dark:bg-indigo-500/5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
          <BellIcon className="h-4.5 w-4.5" />
        </span>
        <div>
          <p className="font-medium text-slate-900 dark:text-white">
            {isSubscribed ? 'Notificações ativas' : 'Ative as notificações'}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {isSubscribed
              ? 'Você vai receber avisos direto no navegador ou app instalado.'
              : 'Receba avisos de orçamento e contas a vencer direto no seu dispositivo.'}
          </p>
          {(subscribeMutation.isError || unsubscribeMutation.isError) && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">Verifique a permissão de notificações do navegador.</p>
          )}
          {testMutation.isSuccess && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {testMutation.data.sent > 0 ? 'Notificação de teste enviada.' : 'Nenhum dispositivo inscrito recebeu o teste.'}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isSubscribed && (
          <Button variant="secondary" size="sm" loading={testMutation.isPending} onClick={() => testMutation.mutate()}>
            Testar
          </Button>
        )}
        <Button
          variant={isSubscribed ? 'secondary' : 'primary'}
          size="sm"
          loading={subscribeMutation.isPending || unsubscribeMutation.isPending}
          onClick={() => (isSubscribed ? unsubscribeMutation.mutate() : subscribeMutation.mutate())}
        >
          {isSubscribed ? 'Desativar' : 'Ativar notificações'}
        </Button>
      </div>
    </div>
  )
}
