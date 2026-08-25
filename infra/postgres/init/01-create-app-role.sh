#!/usr/bin/env bash
# Postgres refuses to strip SUPERUSER from the bootstrap role (POSTGRES_USER),
# and superusers always bypass row-level security. So instead of trying to
# neuter the bootstrap role, this creates a second, genuinely restricted role
# that the application connects as at runtime; Flyway keeps migrating as the
# bootstrap role (needs CREATE TABLE/POLICY). Mirrors
# backend/src/test/resources/testcontainers/create-app-role.sql, which does
# the same thing for integration tests.
set -euo pipefail

: "${APP_DB_PASSWORD:?APP_DB_PASSWORD must be set}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    create role app_runtime with login password '$APP_DB_PASSWORD' nosuperuser;

    grant connect on database "$POSTGRES_DB" to app_runtime;
    grant usage on schema public to app_runtime;

    -- Tables don't exist yet at init time (Flyway hasn't run) — default
    -- privileges make sure app_runtime can use whatever the bootstrap role
    -- creates later.
    alter default privileges for role "$POSTGRES_USER" in schema public
        grant select, insert, update, delete on tables to app_runtime;
    alter default privileges for role "$POSTGRES_USER" in schema public
        grant usage, select on sequences to app_runtime;
EOSQL
