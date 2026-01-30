import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint para criar todas as tabelas do banco de dados
 * GET /api/admin/setup-database
 * 
 * ⚠️ ATENÇÃO: Este endpoint deve ser protegido em produção!
 * Por enquanto, está aberto para facilitar o setup inicial.
 */
export async function GET(request: Request) {
  try {
    // Verificar se DATABASE_URL está configurada
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { 
          ok: false, 
          error: "database_url_not_configured",
          message: "DATABASE_URL não está configurada. Configure no Railway Dashboard → Variables."
        },
        { status: 500 }
      );
    }

    // Verificar se há uma chave de segurança (opcional, mas recomendado)
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    
    // Se você quiser proteger, descomente a linha abaixo e defina ADMIN_SETUP_SECRET no .env
    // if (secret !== process.env.ADMIN_SETUP_SECRET) {
    //   return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    // }

    // Ler o arquivo SQL
    const sqlFilePath = path.join(process.cwd(), "supabase", "SCHEMA_COMPLETO.sql");
    
    if (!fs.existsSync(sqlFilePath)) {
      return NextResponse.json(
        { ok: false, error: "sql_file_not_found", message: "Arquivo SCHEMA_COMPLETO.sql não encontrado" },
        { status: 404 }
      );
    }

    let sql = fs.readFileSync(sqlFilePath, "utf8");

    // Remover comentários de linha (-- até o fim da linha)
    // Mas preservar dentro de blocos $$ ... $$
    sql = sql.replace(/--.*$/gm, "");

    // Executar o SQL
    // Dividir em comandos individuais de forma inteligente
    // Respeitando blocos $$ ... $$ e funções PL/pgSQL
    const commands: string[] = [];
    let currentCommand = "";
    let inDollarQuote = false;
    let dollarTag = "";

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];

      // Detectar início de bloco $$ ... $$
      if (char === "$" && !inDollarQuote) {
        const match = sql.substring(i).match(/^\$([^$]*)\$/);
        if (match) {
          dollarTag = match[0];
          inDollarQuote = true;
          currentCommand += dollarTag;
          i += dollarTag.length - 1; // Pular o resto do tag
          continue;
        }
      }

      // Detectar fim de bloco $$ ... $$
      if (inDollarQuote && sql.substring(i).startsWith(dollarTag)) {
        currentCommand += dollarTag;
        i += dollarTag.length - 1;
        inDollarQuote = false;
        dollarTag = "";
        continue;
      }

      currentCommand += char;

      // Se encontrou ; e não está dentro de um bloco $$, é fim de comando
      if (char === ";" && !inDollarQuote) {
        const trimmed = currentCommand.trim();
        // Filtrar: não vazio e tem conteúdo válido
        if (trimmed.length > 0) {
          commands.push(trimmed);
        }
        currentCommand = "";
      }
    }

    // Adicionar último comando se houver
    const trimmed = currentCommand.trim();
    if (trimmed.length > 0) {
      commands.push(trimmed);
    }

    // Filtrar comandos que são apenas espaços em branco ou vazios
    const validCommands = commands
      .map(cmd => cmd.trim())
      .filter(cmd => {
        // Remover linhas vazias e verificar se sobra algo
        const lines = cmd.split("\n").map(l => l.trim()).filter(l => l.length > 0);
        return lines.length > 0;
      });

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const command of validCommands) {
      try {
        await query(command);
        successCount++;
        results.push({ command: command.substring(0, 100) + "...", status: "success" });
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Ignorar erros de "já existe" (CREATE TABLE IF NOT EXISTS)
        if (errorMessage.includes("already exists") || errorMessage.includes("duplicate")) {
          successCount++;
          results.push({ command: command.substring(0, 100) + "...", status: "skipped", message: "Já existe" });
        } else {
          results.push({ command: command.substring(0, 100) + "...", status: "error", message: errorMessage });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Setup do banco de dados concluído",
      summary: {
        total: validCommands.length,
        success: successCount,
        errors: errorCount,
      },
      results: results.slice(0, 20), // Limitar resultados para não sobrecarregar
    });
  } catch (error) {
    console.error("[Setup Database] Erro:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "internal_error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

