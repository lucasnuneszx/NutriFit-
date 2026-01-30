#!/usr/bin/env node

/**
 * Script para testar conexão com PostgreSQL
 * 
 * USO: node scripts/test-db-connection.js
 */

const { Pool } = require('pg');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;
const DB_SSL = process.env.DB_SSL === 'true';

if (!DATABASE_URL) {
  console.error('❌ Erro: DATABASE_URL não configurada no .env.local');
  process.exit(1);
}

// Parse da URL para debug (sem mostrar senha completa)
const url = new URL(DATABASE_URL);
console.log('🔍 Testando conexão...');
console.log(`   Host: ${url.hostname}`);
console.log(`   Port: ${url.port}`);
console.log(`   User: ${url.username}`);
console.log(`   Database: ${url.pathname.substring(1)}`);
console.log(`   SSL: ${DB_SSL ? 'Sim' : 'Não'}\n`);

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DB_SSL ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
});

async function test() {
  try {
    console.log('📡 Conectando...');
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida!\n');

    // Testar query simples
    console.log('📝 Testando query...');
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Query executada com sucesso!');
    console.log(`   Hora atual: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}\n`);

    // Verificar se tabela users existe
    console.log('🔍 Verificando tabela users...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Tabela "users" existe!\n');
      
      // Contar usuários
      const count = await client.query('SELECT COUNT(*) FROM users');
      console.log(`   Total de usuários: ${count.rows[0].count}\n`);
    } else {
      console.log('⚠️  Tabela "users" NÃO existe!');
      console.log('   Execute: npm run db:setup-all\n');
    }

    client.release();
    await pool.end();
    
    console.log('✅ Teste concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro ao conectar:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.error('\n💡 Solução:');
      console.error('   1. Verifique se a senha na DATABASE_URL está correta');
      console.error('   2. Use a DATABASE_PUBLIC_URL do Railway (não a interna)');
      console.error('   3. Formato: postgresql://user:password@host:port/database');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('\n💡 Solução:');
      console.error('   1. Verifique se o host está correto');
      console.error('   2. Verifique sua conexão com a internet');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 Solução:');
      console.error('   1. Verifique se o host e porta estão corretos');
      console.error('   2. Verifique se o banco está acessível');
    }
    
    await pool.end();
    process.exit(1);
  }
}

test();

