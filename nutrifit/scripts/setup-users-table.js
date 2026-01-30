#!/usr/bin/env node

/**
 * Script para criar tabela de usuários no PostgreSQL do Railway
 * 
 * USO:
 * 1. Configure DATABASE_URL no .env.local
 * 2. Execute: node scripts/setup-users-table.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente do .env.local
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;
const DB_SSL = process.env.DB_SSL === 'true';

if (!DATABASE_URL) {
  console.error('❌ Erro: DATABASE_URL não configurada no .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DB_SSL ? { rejectUnauthorized: false } : false,
});

async function main() {
  console.log('🚀 Criando tabela de usuários no PostgreSQL...\n');

  try {
    // Testar conexão
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida\n');

    // Ler e executar SQL
    const sqlFile = path.join(__dirname, '..', 'supabase', 'users.sql');
    if (!fs.existsSync(sqlFile)) {
      console.error(`❌ Arquivo não encontrado: ${sqlFile}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log('📝 Executando SQL...\n');
    
    await pool.query(sql);
    
    console.log('✅ Tabela de usuários criada com sucesso!');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Adicione JWT_SECRET no .env.local');
    console.log('   2. Reinicie o servidor: npm run dev\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

