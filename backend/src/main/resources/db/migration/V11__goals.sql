create table goals (
    id                    uuid primary key default gen_random_uuid(),
    tenant_id             uuid not null references tenants (id) on delete cascade,
    name                  varchar(255) not null,
    target_amount         numeric(14, 2) not null,
    current_amount        numeric(14, 2) not null default 0,
    target_date           date,
    created_at            timestamptz not null default now(),
    updated_at            timestamptz not null default now()
);

alter table goals enable row level security;
alter table goals force row level security;

create policy tenant_isolation on goals
    using (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid)
    with check (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);

create index idx_goals_tenant on goals (tenant_id);
