#!/usr/bin/env node

/**
 * Script de Migração Completa do Supabase
 * 
 * Este script exporta TODOS os dados do banco Supabase atual
 * e importa para um novo banco Supabase, mantendo tudo integrado.
 * 
 * USO:
 * 1. Configure as variáveis de ambiente ANTES e DEPOIS
 * 2. Execute: node scripts/migrate-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURAÇÃO - ANTES DE EXECUTAR
// ============================================

// BANCO ANTIGO (origem)
const OLD_SUPABASE_URL = process.env.OLD_SUPABASE_URL || '';
const OLD_SUPABASE_SERVICE_KEY = process.env.OLD_SUPABASE_SERVICE_KEY || '';

// BANCO NOVO (destino)
const NEW_SUPABASE_URL = process.env.NEW_SUPABASE_URL || '';
const NEW_SUPABASE_SERVICE_KEY = process.env.NEW_SUPABASE_SERVICE_KEY || '';

// ============================================
// VALIDAÇÃO
// ============================================

if (!OLD_SUPABASE_URL || !OLD_SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: Configure OLD_SUPABASE_URL e OLD_SUPABASE_SERVICE_KEY');
  process.exit(1);
}

if (!NEW_SUPABASE_URL || !NEW_SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: Configure NEW_SUPABASE_URL e NEW_SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// ============================================
// CLIENTES SUPABASE
// ============================================

const oldClient = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const newClient = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ============================================
// LISTA DE TABELAS PARA MIGRAR
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
  // Adicione outras tabelas aqui se necessário
];

// ============================================
// FUNÇÕES DE MIGRAÇÃO
// ============================================

async function migrateTable(tableName) {
  console.log(`\n📦 Migrando tabela: ${tableName}...`);

  try {
    // 1. Buscar todos os dados da tabela antiga
    const { data: oldData, error: fetchError } = await oldClient
      .from(tableName)
      .select('*');

    if (fetchError) {
      console.error(`  ⚠️  Erro ao buscar dados: ${fetchError.message}`);
      return { success: false, count: 0, error: fetchError.message };
    }

    if (!oldData || oldData.length === 0) {
      console.log(`  ✅ Tabela vazia, pulando...`);
      return { success: true, count: 0 };
    }

    console.log(`  📊 Encontrados ${oldData.length} registros`);

    // 2. Inserir no banco novo (em lotes de 100 para evitar timeout)
    const BATCH_SIZE = 100;
    let totalInserted = 0;
    let errors = [];

    for (let i = 0; i < oldData.length; i += BATCH_SIZE) {
      const batch = oldData.slice(i, i + BATCH_SIZE);
      
      const { data: insertedData, error: insertError } = await newClient
        .from(tableName)
        .upsert(batch, { onConflict: 'id' })
        .select();

      if (insertError) {
        console.error(`  ⚠️  Erro ao inserir lote ${i / BATCH_SIZE + 1}: ${insertError.message}`);
        errors.push(insertError.message);
      } else {
        totalInserted += insertedData?.length || batch.length;
        console.log(`  ✅ Lote ${i / BATCH_SIZE + 1} inserido (${totalInserted}/${oldData.length})`);
      }

      // Pequeno delay para evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (errors.length > 0) {
      console.error(`  ⚠️  ${errors.length} erros durante a migração`);
      return { success: false, count: totalInserted, errors };
    }

    console.log(`  ✅ Migração completa: ${totalInserted} registros`);
    return { success: true, count: totalInserted };

  } catch (error) {
    console.error(`  ❌ Erro fatal: ${error.message}`);
    return { success: false, count: 0, error: error.message };
  }
}

async function migrateStorage() {
  console.log(`\n📦 Migrando Storage (imagens)...`);

  try {
    // Listar buckets
    const { data: buckets, error: bucketsError } = await oldClient.storage.listBuckets();

    if (bucketsError) {
      console.error(`  ⚠️  Erro ao listar buckets: ${bucketsError.message}`);
      return { success: false };
    }

    if (!buckets || buckets.length === 0) {
      console.log(`  ✅ Nenhum bucket encontrado`);
      return { success: true };
    }

    console.log(`  📊 Encontrados ${buckets.length} buckets`);

    for (const bucket of buckets) {
      console.log(`  📁 Processando bucket: ${bucket.name}...`);

      // Listar arquivos no bucket
      const { data: files, error: filesError } = await oldClient.storage
        .from(bucket.name)
        .list('', {
          limit: 1000,
          offset: 0,
        });

      if (filesError) {
        console.error(`    ⚠️  Erro ao listar arquivos: ${filesError.message}`);
        continue;
      }

      if (!files || files.length === 0) {
        console.log(`    ✅ Bucket vazio`);
        continue;
      }

      console.log(`    📊 Encontrados ${files.length} arquivos`);

      // Criar bucket no novo Supabase se não existir
      const { error: createBucketError } = await newClient.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes,
      });

      if (createBucketError && !createBucketError.message.includes('already exists')) {
        console.error(`    ⚠️  Erro ao criar bucket: ${createBucketError.message}`);
        continue;
      }

      // Baixar e reenviar cada arquivo
      let uploaded = 0;
      for (const file of files) {
        try {
          // Baixar do bucket antigo
          const { data: fileData, error: downloadError } = await oldClient.storage
            .from(bucket.name)
            .download(file.name);

          if (downloadError) {
            console.error(`      ⚠️  Erro ao baixar ${file.name}: ${downloadError.message}`);
            continue;
          }

          // Upload para o novo bucket
          const { error: uploadError } = await newClient.storage
            .from(bucket.name)
            .upload(file.name, fileData, {
              contentType: file.metadata?.mimetype || 'application/octet-stream',
              upsert: true,
            });

          if (uploadError) {
            console.error(`      ⚠️  Erro ao fazer upload ${file.name}: ${uploadError.message}`);
            continue;
          }

          uploaded++;
          if (uploaded % 10 === 0) {
            console.log(`      ✅ ${uploaded}/${files.length} arquivos migrados...`);
          }

          // Delay para evitar rate limit
          await new Promise(resolve => setTimeout(resolve, 50));

        } catch (error) {
          console.error(`      ⚠️  Erro ao processar ${file.name}: ${error.message}`);
        }
      }

      console.log(`    ✅ Bucket ${bucket.name}: ${uploaded}/${files.length} arquivos migrados`);
    }

    return { success: true };

  } catch (error) {
    console.error(`  ❌ Erro fatal no Storage: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

async function main() {
  console.log('🚀 Iniciando migração do Supabase...\n');
  console.log(`📤 Origem: ${OLD_SUPABASE_URL}`);
  console.log(`📥 Destino: ${NEW_SUPABASE_URL}\n`);

  const results = {
    tables: {},
    storage: null,
    totalRecords: 0,
  };

  // 1. Migrar tabelas
  console.log('='.repeat(60));
  console.log('📊 MIGRANDO TABELAS');
  console.log('='.repeat(60));

  for (const table of TABLES) {
    const result = await migrateTable(table);
    results.tables[table] = result;
    if (result.success) {
      results.totalRecords += result.count;
    }
  }

  // 2. Migrar Storage
  console.log('\n' + '='.repeat(60));
  console.log('📁 MIGRANDO STORAGE');
  console.log('='.repeat(60));

  results.storage = await migrateStorage();

  // 3. Resumo
  console.log('\n' + '='.repeat(60));
  console.log('📋 RESUMO DA MIGRAÇÃO');
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
  console.log(`\n📈 Total de registros migrados: ${results.totalRecords}`);

  console.log('\n✅ Migração concluída!\n');
}

// ============================================
// EXECUTAR
// ============================================

main().catch((error) => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});

