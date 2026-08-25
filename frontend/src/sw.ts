/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)

self.skipWaiting()

// Web Push: the backend sends a JSON payload { title, body, url } signed
// with the VAPID key (see notifications module, Fase 1/2 backend work).
self.addEventListener('push', (event) => {
  if (!event.data) return

  const payload = event.data.json() as { title?: string; body?: string; url?: string }
  const title = payload.title ?? 'Controle de Gastos'

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body,
      icon: '/icons.svg',
      data: { url: payload.url ?? '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data as { url?: string })?.url ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url === url)
      if (existing) {
        return existing.focus()
      }
      return self.clients.openWindow(url)
    }),
  )
})
