# 0001 — Multi-tenant via tenant_id + Row-Level Security

## Status
Aceito (Fase 0).

## Contexto
O sistema começa com uso familiar (poucos tenants), mas precisa evoluir para SaaS
multiusuário sem migração dolorosa. Duas abordagens comuns: schema-per-tenant ou
shared schema com coluna `tenant_id` + isolamento reforçado no banco.

## Decisão
Shared schema. Toda tabela de negócio ganha `tenant_id`, com RLS habilitado e
**forçado** (`ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY`), e uma
política que compara `tenant_id` com a variável de sessão `app.current_tenant`.

A aplicação nunca confia apenas em filtros de query — a política do Postgres é a
última linha de defesa mesmo se um código de aplicação esquecer um `WHERE tenant_id = ?`.

### Descoberta importante: duas roles de banco são obrigatórias
Superusuários **sempre** ignoram RLS, mesmo com `FORCE ROW LEVEL SECURITY`. E o
Postgres recusa remover `SUPERUSER` da role bootstrap (`POSTGRES_USER`/role inicial
do container): "the bootstrap superuser must have the SUPERUSER attribute".

Por isso existem duas roles:
- **Role de migração** (`controle_de_gastos_admin` em produção, role bootstrap nos
  testes): dona do schema, roda o Flyway, pode criar tabelas/políticas.
- **Role de runtime** (`app_runtime`): não-superusuária, é a única que a aplicação
  usa (`spring.datasource.*`). Só ela está de fato sujeita às políticas RLS.

Ver `infra/postgres/init/01-create-app-role.sh` (produção) e
`backend/src/test/resources/testcontainers/create-app-role.sql` (testes) — ambos
criam `app_runtime` e usam `ALTER DEFAULT PRIVILEGES` para que tabelas criadas
depois pelo Flyway já nasçam com os grants corretos.

### Descoberta importante: timing do `SET` da variável de sessão
`TenantAwareDataSource` carimba `app.current_tenant`/`app.current_user` a cada
**checkout de conexão**, não a cada query. Dentro de um único método
`@Transactional`, o Spring/Hibernate obtém a conexão na primeira interação com o
banco e a reutiliza até o commit — então `TenantContext.set(...)` chamado no meio
do método corpo às vezes chega tarde demais (o proxy `@Transactional` já iniciou a
transação, e com ela a conexão, antes do corpo do método rodar).

A solução usada em `AuthService.register` é `TransactionTemplate` em vez de
`@Transactional`: o código controla explicitamente quando a transação começa,
garantindo que `TenantContext` já esteja setado antes disso. `AuthService.login`
resolve de forma diferente: como o `user_id` só é conhecido após a primeira
consulta, o método não é transacional — cada chamada de repositório vira sua
própria transação/checkout, e `UserContext` é setado entre as duas.

### Login e a política de `tenant_members`
No login ainda não sabemos qual tenant selecionar. A política de
`tenant_members` por isso aceita **ou** `tenant_id = app.current_tenant` **ou**
`user_id = app.current_user` — um usuário sempre pode listar os próprios vínculos,
mesmo sem tenant selecionado ainda.

## Consequências
- Cobertura de teste real: `RowLevelSecurityIT` prova isolamento fazendo
  `findAll()` sem nenhum filtro de `tenant_id` explícito e confirmando que só as
  linhas do tenant certo voltam — a suíte falha se a política quebrar.
- `register()` perde um pouco de "pureza" arquitetural (usa `TransactionTemplate`
  em vez do `@Transactional` idiomático) em troca de isolamento correto.
- Cada tabela de negócio nova precisa lembrar de repetir o padrão RLS — não há
  (ainda) uma migration genérica que automatize isso; ficará mais valioso
  automatizar via um helper de migration assim que o número de tabelas crescer
  (Fase 1+).
