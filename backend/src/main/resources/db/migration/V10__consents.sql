create table consents (
    id               uuid primary key default gen_random_uuid(),
    tenant_id        uuid not null references tenants (id) on delete cascade,
    user_id          uuid not null references users (id) on delete cascade,
    type             varchar(50) not null,
    policy_version   varchar(20) not null,
    granted_at       timestamptz not null default now(),
    revoked_at       timestamptz,
    unique (tenant_id, user_id, type, policy_version)
);

alter table consents enable row level security;
alter table consents force row level security;

create policy tenant_isolation on consents
    using (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid)
    with check (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);
