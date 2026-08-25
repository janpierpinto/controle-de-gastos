create table categories (
    id          uuid primary key default gen_random_uuid(),
    tenant_id   uuid references tenants (id) on delete cascade, -- null = categoria padrão global
    parent_id   uuid references categories (id) on delete set null,
    name        varchar(100) not null,
    icon        varchar(50),
    color       varchar(20),
    type        varchar(20) not null check (type in ('EXPENSE', 'INCOME')),
    created_at  timestamptz not null default now()
);

alter table categories enable row level security;
alter table categories force row level security;

-- Categorias globais (tenant_id null) são visíveis a todos, mas só a role de
-- migração (superusuária, usada para seed) pode criá-las — WITH CHECK exige
-- tenant_id = tenant atual para qualquer insert feito pela aplicação
-- (app_runtime), então um tenant nunca consegue criar/alterar uma categoria
-- "global" através da API.
create policy categories_select on categories
    for select using (
        tenant_id is null or tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid
    );
create policy categories_insert on categories
    for insert with check (
        tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid
    );
create policy categories_update on categories
    for update using (
        tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid
    ) with check (
        tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid
    );
create policy categories_delete on categories
    for delete using (
        tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid
    );

create table transactions (
    id            uuid primary key default gen_random_uuid(),
    tenant_id     uuid not null references tenants (id) on delete cascade,
    category_id   uuid references categories (id),
    description   varchar(255) not null,
    amount        numeric(14, 2) not null,
    occurred_on   date not null,
    type          varchar(20) not null check (type in ('EXPENSE', 'INCOME')),
    origin        varchar(20) not null default 'MANUAL' check (origin in ('MANUAL', 'OPEN_FINANCE')),
    is_recurring  boolean not null default false,
    notes         varchar(1000),
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

alter table transactions enable row level security;
alter table transactions force row level security;

create policy tenant_isolation on transactions
    using (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid)
    with check (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);

create index idx_transactions_tenant_date on transactions (tenant_id, occurred_on desc);
create index idx_transactions_category on transactions (category_id);
