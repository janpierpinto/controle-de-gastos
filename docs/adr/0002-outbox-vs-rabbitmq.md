# 0002 — Outbox em Postgres em vez de fila dedicada (RabbitMQ/SQS) no MVP

## Status
Aceito (Fase 0/1). A revisitar na Fase 3/4.

## Contexto
A integração com Open Finance (Pluggy) depende de webhooks: eventos de
transações novas chegam de forma assíncrona e não podem ser perdidos, mesmo se
o processamento subsequente (categorização, disparo de insights, notificações)
falhar ou demorar.

## Decisão
Fase 1/2: o handler do webhook grava o payload cru em `webhook_events`
(padrão *transactional outbox*) e responde 200 imediatamente. Um poller
(`@Scheduled`) processa os eventos pendentes de forma assíncrona, com retry e
idempotência por `pluggy_transaction_id`.

Não introduzir RabbitMQ (ou equivalente) ainda. Motivo: o outbox em Postgres já
garante durabilidade e at-least-once sem operar um broker adicional numa VPS
pequena — que é exatamente o cenário de uso familiar/pequena escala definido
para as primeiras fases.

## Quando revisitar
Introduzir uma fila real quando:
- o backend passar a rodar em múltiplas instâncias (é preciso coordenar quem
  consome cada evento, o que o poller simples não resolve sozinho); ou
- o volume de webhooks/transações justificar processamento paralelo real.

Já existe uma base relacionada rodando desde a Fase 0: o Spring Modulith
(`spring-modulith-starter-jpa`) mantém sua própria tabela `event_publication`
para rastrear a entrega de eventos internos (`ApplicationEventPublisher`) entre
módulos do monólito — é o mesmo princípio de outbox, mas para comunicação
*interna* entre módulos, não para o webhook do Pluggy.

## Consequências
- Menos peças móveis operacionais na Fase 1/2.
- Precisa de disciplina para não deixar o poller virar gargalo — reavaliar
  quando a Fase 3/4 (preparação SaaS) entrar em cena.
