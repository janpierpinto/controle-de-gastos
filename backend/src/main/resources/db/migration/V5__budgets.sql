create table budgets (
    id                    uuid primary key default gen_random_uuid(),
    tenant_id             uuid not null references tenants (id) on delete cascade,
    category_id           uuid not null references categories (id),
    month_reference       date not null, -- sempre o primeiro dia do mês, ex.: 2026-08-01
    planned_amount        numeric(14, 2) not null,
    alert_threshold_pct   smallint not null default 80,
    created_at            timestamptz not null default now(),
    unique (tenant_id, category_id, month_reference)
);

alter table budgets enable row level security;
alter table budgets force row level security;

create policy tenant_isolation on budgets
    using (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid)
    with check (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);

create index idx_budgets_tenant_month on budgets (tenant_id, month_reference);
