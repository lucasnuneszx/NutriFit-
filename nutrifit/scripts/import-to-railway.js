#!/usr/bin/env node

/**
 * Script para importar schema e dados para PostgreSQL do Railway
 * 
 * USO:
 * 1. Configure DATABASE_URL no .env.local
 * 2. Execute: node scripts/import-to-railway.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Erro: DATABASE_URL não configurada no .env.local');
  process.exit(1);
}

// Parse da URL para debug
const urlObj = new URL(DATABASE_URL);
console.log(`🔍 Debug: host=${urlObj.hostname}, port=${urlObj.port}, user=${urlObj.username}, db=${urlObj.pathname.slice(1)}`);

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('rlwy.net') ? {
    rejectUnauthorized: false
  } : false
});

async function executeSQLFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`\n📝 Executando: ${path.basename(filePath)}...`);
  
  try {
    await pool.query(sql);
    console.log(`✅ ${path.basename(filePath)} executado com sucesso`);
    return true;
  } catch (error) {
    // Ignorar erros de "already exists" (tabelas já criadas)
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log(`⚠️  ${path.basename(filePath)}: alguns objetos já existem (ok)`);
      return true;
    }
    console.error(`❌ Erro em ${path.basename(filePath)}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Importando schema e dados para Railway PostgreSQL...\n');
  console.log(`📡 Conectando: ${DATABASE_URL.split('@')[1]}\n`);

  try {
    // Testar conexão
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida\n');

    // 1. Importar schema
    console.log('='.repeat(60));
    console.log('📊 IMPORTANDO SCHEMA');
    console.log('='.repeat(60));
    
    const schemaFile = path.join(__dirname, '..', 'supabase', 'ALL_IN_ONE.sql');
    if (fs.existsSync(schemaFile)) {
      await executeSQLFile(schemaFile);
    } else {
      console.error(`❌ Arquivo não encontrado: ${schemaFile}`);
      process.exit(1);
    }

    // 2. Importar dados (se existirem)
    console.log('\n' + '='.repeat(60));
    console.log('📦 IMPORTANDO DADOS');
    console.log('='.repeat(60));
    
    const dataFile = path.join(__dirname, '..', 'sql-export', 'ALL_DATA.sql');
    if (fs.existsSync(dataFile)) {
      await executeSQLFile(dataFile);
    } else {
      console.log('⚠️  Arquivo de dados não encontrado (ok, banco vazio)');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Importação concluída!');
    console.log('='.repeat(60));
    console.log('\n💡 Próximos passos:');
    console.log('   1. Reinicie o servidor: npm run dev');
    console.log('   2. Teste o sistema\n');

  } catch (error) {
    console.error('\n❌ Erro fatal:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

