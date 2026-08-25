create table push_subscriptions (
    id           uuid primary key default gen_random_uuid(),
    tenant_id    uuid not null references tenants (id) on delete cascade,
    user_id      uuid not null references users (id) on delete cascade,
    endpoint     text not null unique,
    p256dh       varchar(255) not null,
    auth         varchar(255) not null,
    created_at   timestamptz not null default now()
);

alter table push_subscriptions enable row level security;
alter table push_subscriptions force row level security;

create policy tenant_isolation on push_subscriptions
    using (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid)
    with check (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);

create index idx_push_subscriptions_tenant on push_subscriptions (tenant_id);
