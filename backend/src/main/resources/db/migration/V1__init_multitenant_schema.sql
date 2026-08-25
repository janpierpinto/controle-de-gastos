-- Núcleo multi-tenant: tenants (famílias/organizações), usuários, membros e auditoria.
-- Convenção adotada para RLS neste projeto (ver docs/adr/0001-multitenant-rls.md):
--   toda tabela de negócio ganha tenant_id, RLS habilitado e forçado, e a política
--   compara tenant_id com a variável de sessão 'app.current_tenant' definida pela
--   aplicação a cada checkout de conexão (ver TenantAwareDataSource).

create extension if not exists "pgcrypto";

create table tenants (
    id                  uuid primary key default gen_random_uuid(),
    name                varchar(150) not null,
    type                varchar(20)  not null default 'FAMILY' check (type in ('FAMILY', 'ORGANIZATION')),
    plan                varchar(20)  not null default 'FREE',
    dpo_contact_email  varchar(255),
    created_at          timestamptz  not null default now()
);

create table users (
    id             uuid primary key default gen_random_uuid(),
    email          varchar(255) not null unique,
    password_hash  varchar(255) not null,
    name           varchar(150) not null,
    mfa_secret     varchar(255),
    mfa_enabled    boolean      not null default false,
    status         varchar(20)  not null default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED', 'DELETED')),
    created_at     timestamptz  not null default now()
);

create table tenant_members (
    id         uuid primary key default gen_random_uuid(),
    tenant_id  uuid        not null references tenants (id) on delete cascade,
    user_id    uuid        not null references users (id) on delete cascade,
    role       varchar(20) not null check (role in ('OWNER', 'ADMIN', 'MEMBER', 'CHILD')),
    joined_at  timestamptz not null default now(),
    unique (tenant_id, user_id)
);

alter table tenant_members enable row level security;
alter table tenant_members force row level security;

-- A política também libera linhas do próprio usuário autenticado (app.current_user),
-- porque no login precisamos descobrir a quais tenants o usuário pertence ANTES de
-- sabermos qual tenant selecionar em app.current_tenant (ver AuthService.login).
create policy tenant_isolation on tenant_members
    using (
        tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid
        or user_id = nullif(current_setting('app.current_user', true), '')::uuid
    );

create table audit_logs (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       uuid        not null references tenants (id) on delete cascade,
    actor_user_id   uuid references users (id),
    action          varchar(100) not null,
    entity          varchar(100) not null,
    entity_id       uuid,
    ip_address      varchar(45),
    metadata_json   jsonb,
    occurred_at     timestamptz not null default now()
);

alter table audit_logs enable row level security;
alter table audit_logs force row level security;

create policy tenant_isolation on audit_logs
    using (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);

create index idx_tenant_members_user on tenant_members (user_id);
create index idx_audit_logs_tenant_occurred on audit_logs (tenant_id, occurred_at desc);
