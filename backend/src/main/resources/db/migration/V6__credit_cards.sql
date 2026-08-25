create table credit_cards (
    id             uuid primary key default gen_random_uuid(),
    tenant_id      uuid not null references tenants (id) on delete cascade,
    name           varchar(100) not null,
    brand          varchar(50),
    credit_limit   numeric(14, 2),
    closing_day    smallint not null check (closing_day between 1 and 31),
    due_day        smallint not null check (due_day between 1 and 31),
    created_at     timestamptz not null default now()
);

alter table credit_cards enable row level security;
alter table credit_cards force row level security;

create policy tenant_isolation on credit_cards
    using (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid)
    with check (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);

-- Fase 1 (manual) simplifica a fatura para o mês calendário da transação,
-- em vez de calcular o ciclo real a partir de closing_day (fechamento
-- pode cair em qualquer dia). closing_day/due_day ficam como metadados
-- informativos por enquanto; o ciclo real por dia de fechamento faz mais
-- sentido na Fase 2, quando houver conciliação com dados reais do banco
-- via Open Finance.
alter table transactions add column credit_card_id uuid references credit_cards (id);
create index idx_transactions_credit_card on transactions (credit_card_id);
