import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    // Tenta usar função RPC primeiro
    try {
      const rpcResult = await query(`SELECT * FROM admin_list_profiles()`);
      if (rpcResult.rows.length > 0) {
        return NextResponse.json({ ok: true, users: rpcResult.rows });
      }
    } catch {
      // Função RPC não existe, fazer query direta
    }

    // Fallback: query direta
    const result = await query(
      `SELECT 
        id, nome, email, tipo_plano, nome_assistente, contagem_streak,
        plano_pausado, plano_expira_em, plano_iniciado_em, criado_em, atualizado_em
       FROM profiles
       ORDER BY criado_em DESC`
    );

    return NextResponse.json({ ok: true, users: result.rows });
  } catch (error) {
    console.error("[Admin Users] Erro:", error);
    return NextResponse.json(
      { ok: false, error: "db_error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
