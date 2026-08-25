# Controle de Gastos

Sistema de gestão e controle de gastos familiares — Spring Boot + React (PWA),
com integração Open Finance, notificações push, motor de insights e
conformidade LGPD. Arquitetura completa e roadmap faseado em
`docs/` (ver plano de arquitetura na sessão que criou este repositório) e nos
ADRs abaixo.

## Estrutura

```
backend/    Spring Boot 4.1 / Java 21 — API, auth, multi-tenant (RLS)
frontend/   React 19 + Vite / TypeScript — PWA
infra/      docker-compose, Postgres init scripts, Caddy (TLS/reverse proxy)
docs/adr/   Architecture Decision Records
```

## Rodando localmente com Docker

```bash
cd infra
cp .env.example .env   # preencha DB_MIGRATION_PASSWORD, DB_PASSWORD, JWT_SECRET
docker compose up -d --build
```

- Frontend/API: http://localhost
- Health check: `docker exec infra-backend-1 wget -qO- http://localhost:8080/actuator/health`

## Desenvolvimento sem Docker

**Backend** (requer JDK 21 e um Postgres local — ver `infra/postgres/init` para
o padrão de duas roles usado):

```bash
cd backend
./mvnw spring-boot:run
```

**Frontend** (proxy de `/api` para `localhost:8080` já configurado em
`vite.config.ts`):

```bash
cd frontend
npm install
npm run dev
```

## Testes

```bash
cd backend && ./mvnw verify   # unit + integração (Testcontainers, precisa de Docker)
cd frontend && npm run lint && npm run build
```

`RowLevelSecurityIT` e `AuthFlowIT` sobem um Postgres real via Testcontainers e
validam, respectivamente, que o isolamento por tenant é aplicado pelo próprio
banco (RLS) e que o fluxo completo de registro/login funciona pela stack HTTP
real. Cada módulo (transações, orçamentos, cartões, contas a pagar, família,
notificações, privacidade) tem seu próprio `*FlowIT` cobrindo o fluxo HTTP
completo — 15 testes de integração ao todo, todos passando.

## Decisões de arquitetura

- [`docs/adr/0001-multitenant-rls.md`](docs/adr/0001-multitenant-rls.md) — multi-tenant via `tenant_id` + Row-Level Security, e por que isso exige duas roles de banco.
- [`docs/adr/0002-outbox-vs-rabbitmq.md`](docs/adr/0002-outbox-vs-rabbitmq.md) — outbox em Postgres em vez de fila dedicada no MVP.

## Roadmap

- **Fase 0** — setup, autenticação JWT, base multi-tenant (RLS). ✅
- **Fase 1 (MVP)** — transações manuais, categorias, orçamentos com alertas,
  dashboard com gráfico, cartão de crédito manual (fatura mensal), contas a
  pagar, módulo família (convites), dark mode, PWA instalável, push
  notifications básico, LGPD básico (consentimento, audit log, meus dados).
  ✅ Falta apenas o deploy real numa VPS (a infra em `infra/` já está pronta
  para isso — falta só provisionar o servidor).
- **Fase 2** — integração Open Finance (Pluggy), categorização automática,
  insights por regras, split de despesas entre membros.
- **Fase 3** — insights via IA generativa, forecasting, 2FA, relatórios.
- **Fase 4** — preparação para SaaS multi-tenant em escala.

Detalhes de cada fase no plano de arquitetura da sessão que originou este
projeto.
