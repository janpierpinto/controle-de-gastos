create table bills_to_pay (
    id                     uuid primary key default gen_random_uuid(),
    tenant_id              uuid not null references tenants (id) on delete cascade,
    description            varchar(255) not null,
    amount                 numeric(14, 2) not null,
    due_date               date not null,
    status                 varchar(20) not null default 'PENDING' check (status in ('PENDING', 'PAID')),
    recurring              boolean not null default false,
    reminder_days_before   smallint not null default 3,
    paid_at                timestamptz,
    created_at             timestamptz not null default now()
);

alter table bills_to_pay enable row level security;
alter table bills_to_pay force row level security;

create policy tenant_isolation on bills_to_pay
    using (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid)
    with check (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);

create index idx_bills_tenant_due on bills_to_pay (tenant_id, due_date);
