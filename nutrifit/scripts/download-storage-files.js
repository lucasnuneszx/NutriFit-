#!/usr/bin/env node

/**
 * Script para Baixar Arquivos do Storage do Supabase
 * 
 * Este script baixa todas as imagens/arquivos do Storage do Supabase
 * para a pasta local sql-export/storage/files/
 * 
 * USO:
 * 1. Execute primeiro: npm run export:sql (para gerar storage/files.json)
 * 2. Execute: node scripts/download-storage-files.js
 */

const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ============================================
// CONFIGURAÇÃO
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

const FILES_JSON = path.join(__dirname, '..', 'sql-export', 'storage', 'files.json');
const DOWNLOAD_DIR = path.join(__dirname, '..', 'sql-export', 'storage', 'files');

// ============================================
// VALIDAÇÃO
// ============================================

if (!fs.existsSync(FILES_JSON)) {
  console.error('❌ Erro: Arquivo storage/files.json não encontrado');
  console.error('   Execute primeiro: npm run export:sql');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: Configure SUPABASE_URL e SUPABASE_SERVICE_KEY');
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
// FUNÇÕES
// ============================================

function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Redirect
        return downloadFile(response.headers.location, filePath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }

      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

async function downloadFromSupabase(bucket, fileName, filePath) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(fileName);

    if (error) {
      throw error;
    }

    // Converter Blob para Buffer e salvar
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);
    
    return true;
  } catch (error) {
    console.error(`  ⚠️  Erro ao baixar via API: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando download de arquivos do Storage...\n');

  // Ler lista de arquivos
  const files = JSON.parse(fs.readFileSync(FILES_JSON, 'utf8'));
  
  if (!files || files.length === 0) {
    console.log('✅ Nenhum arquivo para baixar');
    return;
  }

  // Criar diretório de download
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }

  console.log(`📊 Total de arquivos: ${files.length}\n`);

  let downloaded = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const bucketDir = path.join(DOWNLOAD_DIR, file.bucket);
    const filePath = path.join(bucketDir, file.name);

    // Criar diretório do bucket se não existir
    if (!fs.existsSync(bucketDir)) {
      fs.mkdirSync(bucketDir, { recursive: true });
    }

    // Pular se já existe
    if (fs.existsSync(filePath)) {
      console.log(`  ⏭️  [${i + 1}/${files.length}] Já existe: ${file.bucket}/${file.name}`);
      downloaded++;
      continue;
    }

    console.log(`  📥 [${i + 1}/${files.length}] Baixando: ${file.bucket}/${file.name}...`);

    let success = false;

    // Tentar baixar via API do Supabase primeiro (mais confiável)
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      success = await downloadFromSupabase(file.bucket, file.name, filePath);
    }

    // Se falhar, tentar via URL pública
    if (!success && file.public_url) {
      try {
        await downloadFile(file.public_url, filePath);
        success = true;
      } catch (error) {
        errors.push({ file: `${file.bucket}/${file.name}`, error: error.message });
      }
    }

    if (success) {
      downloaded++;
      const stats = fs.statSync(filePath);
      console.log(`     ✅ Baixado (${(stats.size / 1024).toFixed(2)} KB)`);
    } else {
      failed++;
      console.log(`     ❌ Falhou`);
    }

    // Pequeno delay para evitar rate limit
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('📋 RESUMO');
  console.log('='.repeat(60));
  console.log(`✅ Baixados: ${downloaded}`);
  console.log(`❌ Falharam: ${failed}`);
  console.log(`📁 Local: ${DOWNLOAD_DIR}`);

  if (errors.length > 0) {
    console.log(`\n⚠️  Erros:`);
    errors.slice(0, 10).forEach(({ file, error }) => {
      console.log(`   - ${file}: ${error}`);
    });
    if (errors.length > 10) {
      console.log(`   ... e mais ${errors.length - 10} erros`);
    }
  }

  console.log('\n✅ Download concluído!\n');
}

main().catch((error) => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});

