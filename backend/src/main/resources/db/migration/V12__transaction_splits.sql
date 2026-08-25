create table transaction_splits (
    id                 uuid primary key default gen_random_uuid(),
    tenant_id          uuid not null references tenants (id) on delete cascade,
    transaction_id     uuid not null references transactions (id) on delete cascade,
    tenant_member_id   uuid not null references tenant_members (id) on delete cascade,
    amount             numeric(14, 2) not null,
    created_at         timestamptz not null default now(),
    unique (transaction_id, tenant_member_id)
);

alter table transaction_splits enable row level security;
alter table transaction_splits force row level security;

create policy tenant_isolation on transaction_splits
    using (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid)
    with check (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);

create index idx_transaction_splits_tenant_transaction on transaction_splits (tenant_id, transaction_id);
