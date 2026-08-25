-- tenant_id null = categoria padrão global, visível a todos os tenants.
-- Executa como a role de migração (superusuária), que ignora RLS — por isso
-- consegue inserir linhas com tenant_id null mesmo com a policy
-- categories_insert exigindo tenant_id = tenant atual para a role de runtime.
insert into categories (name, icon, color, type) values
    ('Alimentação', 'utensils', '#f97316', 'EXPENSE'),
    ('Transporte', 'car', '#3b82f6', 'EXPENSE'),
    ('Moradia', 'home', '#8b5cf6', 'EXPENSE'),
    ('Saúde', 'heart-pulse', '#ef4444', 'EXPENSE'),
    ('Educação', 'graduation-cap', '#06b6d4', 'EXPENSE'),
    ('Lazer', 'party-popper', '#ec4899', 'EXPENSE'),
    ('Assinaturas', 'repeat', '#a855f7', 'EXPENSE'),
    ('Compras', 'shopping-bag', '#f59e0b', 'EXPENSE'),
    ('Outros gastos', 'more-horizontal', '#64748b', 'EXPENSE'),
    ('Salário', 'wallet', '#22c55e', 'INCOME'),
    ('Outras receitas', 'trending-up', '#10b981', 'INCOME');
