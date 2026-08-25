import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      // Lets frontend code always call relative /api/v1/... URLs, matching
      // what Caddy does in production (see infra/Caddyfile).
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Push notifications need their own logic beyond what Workbox
      // generates, so we own the service worker file instead of letting
      // the plugin inject one (see public/sw-push.js, imported below).
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        swSrc: 'src/sw.ts',
      },
      manifest: {
        name: 'Controle de Gastos',
        short_name: 'Gastos',
        description: 'Gestão e controle de gastos familiares',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        icons: [
          // TODO(Fase 1): substituir por ícones PNG 192x192/512x512
          // desenhados de verdade — placeholder só para instalabilidade.
          {
            src: 'icons.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
