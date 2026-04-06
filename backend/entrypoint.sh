#!/bin/bash
set -e

echo "⏳ Aguardando PostgreSQL..."
until python -c "import psycopg2; psycopg2.connect('$DATABASE_URL')" 2>/dev/null; do
  sleep 1
done
echo "✅ PostgreSQL pronto"

echo "🔄 Aplicando migrações..."
alembic upgrade head

echo "🌱 Executando seed (se necessário)..."
python seed.py

echo "🚀 Iniciando servidor..."
exec "$@"
