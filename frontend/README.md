# Controle de Gastos — Frontend

React 19 + TypeScript + Vite, como PWA (service worker próprio em `src/sw.ts`,
combinando precache do Workbox com o handler de push notifications).

Ver o [README na raiz do repositório](../README.md) para instruções completas
de setup (com ou sem Docker) e para os ADRs de arquitetura.

## Comandos

```bash
npm install
npm run dev      # http://localhost:5173, proxy de /api para localhost:8080
npm run build    # type-check + build de produção (inclui o service worker)
npm run lint
```
