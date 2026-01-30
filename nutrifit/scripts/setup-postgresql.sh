#!/bin/bash

# Script de Setup do PostgreSQL para NutriFit+
# Este script cria o banco de dados e importa o schema

set -e

echo "🚀 Configurando PostgreSQL para NutriFit+..."
echo ""

# Variáveis (podem ser sobrescritas por variáveis de ambiente)
DB_NAME="${DB_NAME:-nutrifit}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Verificar se PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL não está instalado!"
    echo ""
    echo "📦 Instale o PostgreSQL:"
    echo "   macOS: brew install postgresql@15"
    echo "   Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    echo "   Windows: https://www.postgresql.org/download/windows/"
    exit 1
fi

echo "✅ PostgreSQL encontrado"
echo ""

# Criar banco de dados (se não existir)
echo "📦 Criando banco de dados '$DB_NAME'..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"

if [ $? -eq 0 ]; then
    echo "✅ Banco de dados criado/verificado"
else
    echo "⚠️  Banco de dados pode já existir ou erro de permissão"
fi
echo ""

# Executar schema
SCHEMA_FILE="supabase/ALL_IN_ONE.sql"
if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ Arquivo de schema não encontrado: $SCHEMA_FILE"
    exit 1
fi

echo "📝 Importando schema..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCHEMA_FILE" > /dev/null 2>&1 || {
    echo "⚠️  Alguns erros podem ter ocorrido (tabelas podem já existir)"
}

echo "✅ Schema importado"
echo ""

# Importar dados (se existirem)
DATA_FILE="sql-export/ALL_DATA.sql"
if [ -f "$DATA_FILE" ]; then
    echo "📊 Importando dados..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$DATA_FILE" > /dev/null 2>&1 || {
        echo "⚠️  Alguns erros podem ter ocorrido ao importar dados"
    }
    echo "✅ Dados importados"
    echo ""
fi

echo "✅ Setup concluído!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Configure as variáveis de ambiente no .env.local:"
echo "      DATABASE_URL=\"postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME\""
echo "   2. Ou configure individualmente:"
echo "      DB_HOST=\"$DB_HOST\""
echo "      DB_PORT=\"$DB_PORT\""
echo "      DB_NAME=\"$DB_NAME\""
echo "      DB_USER=\"$DB_USER\""
echo "      DB_PASSWORD=\"$DB_PASSWORD\""
echo "   3. Reinicie o servidor: npm run dev"
echo ""

