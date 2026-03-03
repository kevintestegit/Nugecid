-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Configurações de timezone
SET timezone = 'America/Fortaleza';

-- Usuário para aplicação (opcional - mais seguro)
CREATE USER sgc_app WITH PASSWORD :APP_DB_PASSWORD;
GRANT CONNECT ON DATABASE sgc_itep TO sgc_app;
GRANT USAGE ON SCHEMA public TO sgc_app;
GRANT CREATE ON SCHEMA public TO sgc_app;