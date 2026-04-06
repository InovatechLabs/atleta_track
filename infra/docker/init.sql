-- Extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configurações de encoding e timezone
SET client_encoding = 'UTF8';
SET timezone = 'America/Sao_Paulo';

-- Índices extras para performance (RNF03)
-- (As tabelas são criadas pelo Alembic; estes índices são aplicados após o seed)
