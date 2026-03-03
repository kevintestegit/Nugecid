#!/usr/bin/env bash
set -euo pipefail

DB_HOST="${METABASE_BOOTSTRAP_DB_HOST:-db}"
DB_PORT="${METABASE_BOOTSTRAP_DB_PORT:-5432}"
DB_SUPERUSER="${POSTGRES_USER:?POSTGRES_USER is required}"
DB_SUPERPASS="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
MAIN_DB="${POSTGRES_DB:?POSTGRES_DB is required}"

METABASE_APP_DB="${METABASE_APP_DB:-metabase_app}"
METABASE_APP_USER="${METABASE_APP_USER:-metabase_app}"
METABASE_APP_PASSWORD="${METABASE_APP_PASSWORD:?METABASE_APP_PASSWORD is required}"

METABASE_ANALYTICS_DB="${METABASE_ANALYTICS_DB:-$MAIN_DB}"
METABASE_ANALYTICS_SCHEMA="${METABASE_ANALYTICS_SCHEMA:-analytics}"
METABASE_ANALYTICS_USER="${METABASE_ANALYTICS_USER:-metabase_analytics}"
METABASE_ANALYTICS_PASSWORD="${METABASE_ANALYTICS_PASSWORD:?METABASE_ANALYTICS_PASSWORD is required}"

export PGPASSWORD="$DB_SUPERPASS"

psql_base=(
  psql
  -v
  ON_ERROR_STOP=1
  -h
  "$DB_HOST"
  -p
  "$DB_PORT"
  -U
  "$DB_SUPERUSER"
)

echo "[metabase-bootstrap] waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -d postgres >/dev/null 2>&1; do
  sleep 2
done

echo "[metabase-bootstrap] provisioning Metabase application database and analytics role..."
"${psql_base[@]}" -d postgres \
  -v app_db="$METABASE_APP_DB" \
  -v app_user="$METABASE_APP_USER" \
  -v app_pass="$METABASE_APP_PASSWORD" \
  -v analytics_db="$METABASE_ANALYTICS_DB" \
  -v analytics_user="$METABASE_ANALYTICS_USER" \
  -v analytics_pass="$METABASE_ANALYTICS_PASSWORD" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'app_user', :'app_pass')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_user') \gexec

SELECT format('ALTER ROLE %I WITH LOGIN PASSWORD %L', :'app_user', :'app_pass') \gexec

SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'analytics_user', :'analytics_pass')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'analytics_user') \gexec

SELECT format('ALTER ROLE %I WITH LOGIN PASSWORD %L', :'analytics_user', :'analytics_pass') \gexec

SELECT format('CREATE DATABASE %I OWNER %I', :'app_db', :'app_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'app_db') \gexec

SELECT format('GRANT CONNECT ON DATABASE %I TO %I', :'analytics_db', :'analytics_user') \gexec
SQL

echo "[metabase-bootstrap] granting read-only access to analytics schema ${METABASE_ANALYTICS_SCHEMA} in ${METABASE_ANALYTICS_DB}..."
"${psql_base[@]}" -d "$METABASE_ANALYTICS_DB" \
  -v analytics_schema="$METABASE_ANALYTICS_SCHEMA" \
  -v analytics_user="$METABASE_ANALYTICS_USER" \
  -v owner_user="$DB_SUPERUSER" <<'SQL'
SELECT format('CREATE SCHEMA IF NOT EXISTS %I AUTHORIZATION %I', :'analytics_schema', :'owner_user') \gexec

SELECT format('GRANT USAGE ON SCHEMA %I TO %I', :'analytics_schema', :'analytics_user') \gexec

SELECT format('GRANT SELECT ON ALL TABLES IN SCHEMA %I TO %I', :'analytics_schema', :'analytics_user') \gexec

SELECT format(
  'ALTER DEFAULT PRIVILEGES FOR USER %I IN SCHEMA %I GRANT SELECT ON TABLES TO %I',
  :'owner_user',
  :'analytics_schema',
  :'analytics_user'
) \gexec

SELECT format(
  'ALTER DEFAULT PRIVILEGES FOR USER %I IN SCHEMA %I GRANT SELECT ON SEQUENCES TO %I',
  :'owner_user',
  :'analytics_schema',
  :'analytics_user'
) \gexec
SQL

echo "[metabase-bootstrap] done."
