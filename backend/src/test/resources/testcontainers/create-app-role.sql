-- Postgres refuses to strip SUPERUSER from the bootstrap role ("the
-- bootstrap superuser must have the SUPERUSER attribute"), and superusers
-- always bypass row-level security. So instead of neutering "test", this
-- creates a second, genuinely restricted role that the application actually
-- connects as; Flyway keeps migrating as the bootstrap role. See
-- TestcontainersConfiguration and infra/postgres/init for how each side
-- gets wired to the right role.
create role app_runtime with login password 'app_runtime' nosuperuser;

grant connect on database "test" to app_runtime;
grant usage on schema public to app_runtime;

-- Tables don't exist yet at init time (Flyway hasn't run) — default
-- privileges make sure app_runtime can use whatever "test" creates later.
alter default privileges for role "test" in schema public
    grant select, insert, update, delete on tables to app_runtime;
alter default privileges for role "test" in schema public
    grant usage, select on sequences to app_runtime;
