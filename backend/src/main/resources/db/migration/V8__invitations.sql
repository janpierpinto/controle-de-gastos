create table invitations (
    id           uuid primary key default gen_random_uuid(),
    tenant_id    uuid not null references tenants (id) on delete cascade,
    email        varchar(255) not null,
    token        varchar(64) not null unique,
    role         varchar(20) not null check (role in ('ADMIN', 'MEMBER', 'CHILD')),
    status       varchar(20) not null default 'PENDING' check (status in ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')),
    expires_at   timestamptz not null,
    created_at   timestamptz not null default now()
);

alter table invitations enable row level security;
alter table invitations force row level security;

-- Assim como em tenant_members (V1), aceitar um convite acontece antes de
-- haver um tenant selecionado: quem tem o token em mãos precisa conseguir
-- localizar o convite sem estar autenticado em nenhum tenant ainda. Por
-- isso a policy também libera por token, via a mesma variável de sessão
-- app.lookup_secret usada nesse fluxo (ver LookupSecretContext).
create policy invitations_select on invitations
    for select using (
        tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid
        or token = nullif(current_setting('app.lookup_secret', true), '')
    );
create policy invitations_insert on invitations
    for insert with check (
        tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid
    );
create policy invitations_update on invitations
    for update using (
        tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid
        or token = nullif(current_setting('app.lookup_secret', true), '')
    ) with check (
        tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid
        or token = nullif(current_setting('app.lookup_secret', true), '')
    );

create index idx_invitations_tenant on invitations (tenant_id);
