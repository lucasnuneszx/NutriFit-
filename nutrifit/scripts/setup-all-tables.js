#!/usr/bin/env node

/**
 * Script para criar TODAS as tabelas no PostgreSQL do Railway
 * 
 * USO:
 * 1. Configure DATABASE_URL no .env.local
 * 2. Execute: npm run db:setup-all
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
  console.log('🚀 Criando TODAS as tabelas no PostgreSQL...\n');

  try {
    // Testar conexão
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida\n');

    // Ler e executar SQL
    const sqlFile = path.join(__dirname, '..', 'supabase', 'SCHEMA_COMPLETO.sql');
    if (!fs.existsSync(sqlFile)) {
      console.error(`❌ Arquivo não encontrado: ${sqlFile}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log('📝 Executando SQL completo...\n');
    
    await pool.query(sql);
    
    console.log('✅ Todas as tabelas criadas com sucesso!');
    console.log('\n📊 Tabelas criadas:');
    console.log('  ✅ users (autenticação)');
    console.log('  ✅ profiles (perfis)');
    console.log('  ✅ biometrics (biometria)');
    console.log('  ✅ logs (scans de refeição)');
    console.log('  ✅ diet_plans (planos de dieta)');
    console.log('  ✅ workout_plans (planos de treino)');
    console.log('  ✅ workout_items (exercícios)');
    console.log('  ✅ workout_sessions (sessões)');
    console.log('  ✅ workout_session_items (itens da sessão)');
    console.log('  ✅ workout_sets (séries)');
    console.log('  ✅ transactions (pagamentos)');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Adicione JWT_SECRET no .env.local');
    console.log('   2. Reinicie o servidor: npm run dev\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\n💡 Algumas tabelas já existem. Isso é normal se você já executou o script antes.');
      console.log('   Para recriar tudo, você pode dropar as tabelas manualmente ou usar DROP CASCADE.\n');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

