#!/usr/bin/env node

/**
 * Script de Exportação do Supabase para Arquivos SQL
 * 
 * Este script exporta TODOS os dados do Supabase e gera arquivos SQL
 * que podem ser importados em qualquer banco SQL local (PostgreSQL, MySQL, SQLite, etc.)
 * 
 * USO:
 * 1. Configure as variáveis de ambiente do Supabase
 * 2. Execute: node scripts/export-supabase-to-sql.js
 * 3. Os arquivos SQL serão gerados em scripts/sql-export/
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURAÇÃO
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

// Diretório de saída
const OUTPUT_DIR = path.join(__dirname, '..', 'sql-export');
const TABLES_DIR = path.join(OUTPUT_DIR, 'tables');
const STORAGE_DIR = path.join(OUTPUT_DIR, 'storage');

// ============================================
// VALIDAÇÃO
// ============================================

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: Configure SUPABASE_URL e SUPABASE_SERVICE_KEY');
  console.error('   Use as variáveis do .env.local ou defina manualmente');
  process.exit(1);
}

// ============================================
// CLIENTE SUPABASE
// ============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ============================================
// LISTA DE TABELAS
// ============================================

const TABLES = [
  'profiles',
  'biometrics',
  'logs',
  'diet_plans',
  'workout_plans',
  'workout_items',
  'workout_sessions',
  'workout_session_items',
  'workout_sets',
  'transactions',
];

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function escapeSQL(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (typeof value === 'object') {
    // JSONB ou objetos
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }
  
  // String - escapa aspas simples
  return `'${String(value).replace(/'/g, "''")}'`;
}

function generateInsertSQL(tableName, data) {
  if (!data || data.length === 0) {
    return `-- Tabela ${tableName}: sem dados\n`;
  }

  let sql = `-- ============================================\n`;
  sql += `-- Tabela: ${tableName}\n`;
  sql += `-- Registros: ${data.length}\n`;
  sql += `-- ============================================\n\n`;

  // Desabilita temporariamente triggers e constraints para inserção rápida
  sql += `-- Desabilitar triggers temporariamente\n`;
  sql += `ALTER TABLE ${tableName} DISABLE TRIGGER ALL;\n\n`;

  // Gera INSERTs
  for (const row of data) {
    const columns = Object.keys(row).join(', ');
    const values = Object.values(row).map(escapeSQL).join(', ');
    
    sql += `INSERT INTO ${tableName} (${columns}) VALUES (${values});\n`;
  }

  // Reabilita triggers
  sql += `\n-- Reabilitar triggers\n`;
  sql += `ALTER TABLE ${tableName} ENABLE TRIGGER ALL;\n\n`;

  return sql;
}

// ============================================
// EXPORTAR TABELA
// ============================================

async function exportTable(tableName) {
  console.log(`\n📦 Exportando tabela: ${tableName}...`);

  try {
    // Buscar todos os dados
    const { data, error } = await supabase
      .from(tableName)
      .select('*');

    if (error) {
      console.error(`  ⚠️  Erro: ${error.message}`);
      return { success: false, count: 0, error: error.message };
    }

    if (!data || data.length === 0) {
      console.log(`  ✅ Tabela vazia`);
      const sql = `-- Tabela ${tableName}: sem dados\n`;
      fs.writeFileSync(path.join(TABLES_DIR, `${tableName}.sql`), sql);
      return { success: true, count: 0 };
    }

    console.log(`  📊 Encontrados ${data.length} registros`);

    // Gerar SQL
    const sql = generateInsertSQL(tableName, data);
    const filePath = path.join(TABLES_DIR, `${tableName}.sql`);
    fs.writeFileSync(filePath, sql, 'utf8');

    console.log(`  ✅ Arquivo gerado: ${filePath}`);
    return { success: true, count: data.length };

  } catch (error) {
    console.error(`  ❌ Erro fatal: ${error.message}`);
    return { success: false, count: 0, error: error.message };
  }
}

// ============================================
// EXPORTAR STORAGE (LISTA DE ARQUIVOS)
// ============================================

async function exportStorage() {
  console.log(`\n📦 Exportando lista de arquivos do Storage...`);

  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error(`  ⚠️  Erro ao listar buckets: ${bucketsError.message}`);
      return { success: false };
    }

    if (!buckets || buckets.length === 0) {
      console.log(`  ✅ Nenhum bucket encontrado`);
      return { success: true, files: [] };
    }

    const allFiles = [];

    for (const bucket of buckets) {
      console.log(`  📁 Processando bucket: ${bucket.name}...`);

      const { data: files, error: filesError } = await supabase.storage
        .from(bucket.name)
        .list('', {
          limit: 1000,
          offset: 0,
        });

      if (filesError) {
        console.error(`    ⚠️  Erro: ${filesError.message}`);
        continue;
      }

      if (!files || files.length === 0) {
        console.log(`    ✅ Bucket vazio`);
        continue;
      }

      console.log(`    📊 Encontrados ${files.length} arquivos`);

      // Gerar URLs públicas (se possível)
      for (const file of files) {
        const { data: urlData } = supabase.storage
          .from(bucket.name)
          .getPublicUrl(file.name);

        allFiles.push({
          bucket: bucket.name,
          name: file.name,
          size: file.metadata?.size || 0,
          mimetype: file.metadata?.mimetype || 'unknown',
          public_url: urlData?.publicUrl || '',
          created_at: file.created_at || new Date().toISOString(),
        });
      }
    }

    // Salvar lista em JSON e SQL
    const jsonPath = path.join(STORAGE_DIR, 'files.json');
    fs.writeFileSync(jsonPath, JSON.stringify(allFiles, null, 2), 'utf8');

    // Gerar SQL para criar tabela de referência (opcional)
    let sql = `-- ============================================\n`;
    sql += `-- Lista de Arquivos do Storage\n`;
    sql += `-- Total: ${allFiles.length} arquivos\n`;
    sql += `-- ============================================\n\n`;
    sql += `-- Esta tabela é apenas uma referência dos arquivos que estavam no Storage\n`;
    sql += `-- Os arquivos reais precisam ser baixados manualmente ou via script\n\n`;
    sql += `CREATE TABLE IF NOT EXISTS storage_files (\n`;
    sql += `  id SERIAL PRIMARY KEY,\n`;
    sql += `  bucket TEXT NOT NULL,\n`;
    sql += `  name TEXT NOT NULL,\n`;
    sql += `  size BIGINT,\n`;
    sql += `  mimetype TEXT,\n`;
    sql += `  public_url TEXT,\n`;
    sql += `  created_at TIMESTAMPTZ\n`;
    sql += `);\n\n`;

    for (const file of allFiles) {
      sql += `INSERT INTO storage_files (bucket, name, size, mimetype, public_url, created_at) VALUES (`;
      sql += `${escapeSQL(file.bucket)}, `;
      sql += `${escapeSQL(file.name)}, `;
      sql += `${file.size}, `;
      sql += `${escapeSQL(file.mimetype)}, `;
      sql += `${escapeSQL(file.public_url)}, `;
      sql += `${escapeSQL(file.created_at)}`;
      sql += `);\n`;
    }

    const sqlPath = path.join(STORAGE_DIR, 'files.sql');
    fs.writeFileSync(sqlPath, sql, 'utf8');

    console.log(`  ✅ Lista exportada: ${jsonPath}`);
    console.log(`  ✅ SQL gerado: ${sqlPath}`);
    console.log(`  📊 Total: ${allFiles.length} arquivos`);

    return { success: true, files: allFiles };

  } catch (error) {
    console.error(`  ❌ Erro fatal: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ============================================
// GERAR ARQUIVO MASTER (TUDO JUNTO)
// ============================================

function generateMasterSQL(results) {
  console.log(`\n📝 Gerando arquivo master (tudo junto)...`);

  let masterSQL = `-- ============================================\n`;
  masterSQL += `-- NutriFit+ - Exportação Completa de Dados\n`;
  masterSQL += `-- Gerado em: ${new Date().toISOString()}\n`;
  masterSQL += `-- ============================================\n\n`;
  masterSQL += `-- IMPORTANTE:\n`;
  masterSQL += `-- 1. Execute o schema primeiro (supabase/ALL_IN_ONE.sql)\n`;
  masterSQL += `-- 2. Depois execute este arquivo para importar os dados\n`;
  masterSQL += `-- 3. A ordem das tabelas importa (respeite foreign keys)\n\n`;

  // Ordem correta (respeitando foreign keys)
  const orderedTables = [
    'profiles',
    'biometrics',
    'workout_plans',
    'workout_items',
    'workout_sessions',
    'workout_session_items',
    'workout_sets',
    'diet_plans',
    'logs',
    'transactions',
  ];

  for (const table of orderedTables) {
    const result = results.tables[table];
    if (result && result.success && result.count > 0) {
      const filePath = path.join(TABLES_DIR, `${table}.sql`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        masterSQL += `\n${content}\n`;
      }
    }
  }

  const masterPath = path.join(OUTPUT_DIR, 'ALL_DATA.sql');
  fs.writeFileSync(masterPath, masterSQL, 'utf8');
  console.log(`  ✅ Arquivo master gerado: ${masterPath}`);

  return masterPath;
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

async function main() {
  console.log('🚀 Iniciando exportação do Supabase para SQL...\n');
  console.log(`📤 Supabase: ${SUPABASE_URL}\n`);

  // Criar diretórios
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  if (!fs.existsSync(TABLES_DIR)) {
    fs.mkdirSync(TABLES_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }

  const results = {
    tables: {},
    storage: null,
    totalRecords: 0,
  };

  // 1. Exportar tabelas
  console.log('='.repeat(60));
  console.log('📊 EXPORTANDO TABELAS');
  console.log('='.repeat(60));

  for (const table of TABLES) {
    const result = await exportTable(table);
    results.tables[table] = result;
    if (result.success) {
      results.totalRecords += result.count;
    }
  }

  // 2. Exportar Storage
  console.log('\n' + '='.repeat(60));
  console.log('📁 EXPORTANDO STORAGE');
  console.log('='.repeat(60));

  results.storage = await exportStorage();

  // 3. Gerar arquivo master
  const masterPath = generateMasterSQL(results);

  // 4. Resumo
  console.log('\n' + '='.repeat(60));
  console.log('📋 RESUMO DA EXPORTAÇÃO');
  console.log('='.repeat(60));

  console.log('\n📊 Tabelas:');
  for (const [table, result] of Object.entries(results.tables)) {
    const status = result.success ? '✅' : '❌';
    console.log(`  ${status} ${table}: ${result.count} registros`);
    if (result.error) {
      console.log(`     Erro: ${result.error}`);
    }
  }

  console.log(`\n📁 Storage: ${results.storage?.success ? '✅' : '❌'}`);
  if (results.storage?.files) {
    console.log(`   Arquivos listados: ${results.storage.files.length}`);
  }

  console.log(`\n📈 Total de registros exportados: ${results.totalRecords}`);
  console.log(`\n📁 Arquivos gerados em: ${OUTPUT_DIR}`);
  console.log(`   - Tabelas individuais: ${TABLES_DIR}`);
  console.log(`   - Storage: ${STORAGE_DIR}`);
  console.log(`   - Arquivo master: ${masterPath}`);

  console.log('\n✅ Exportação concluída!\n');
  console.log('💡 PRÓXIMOS PASSOS:');
  console.log('   1. Execute o schema no seu banco SQL local (supabase/ALL_IN_ONE.sql)');
  console.log('   2. Execute o arquivo master (sql-export/ALL_DATA.sql) ou os arquivos individuais');
  console.log('   3. Para as imagens, baixe manualmente ou use as URLs do storage/files.json\n');
}

// ============================================
// EXECUTAR
// ============================================

main().catch((error) => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});

