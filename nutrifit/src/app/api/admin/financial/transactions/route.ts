import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limitRaw = searchParams.get("limit");
  const limit = limitRaw ? Math.min(100, Math.max(1, Number(limitRaw))) : 50;

  try {
    // Tenta usar função RPC primeiro
    try {
      const rpcResult = await query(
        `SELECT * FROM admin_list_transactions() LIMIT $1`,
        [limit]
      );

      if (rpcResult.rows.length > 0) {
        return NextResponse.json({
          ok: true,
          transactions: rpcResult.rows,
        });
      }
    } catch {
      // Função RPC não existe, fazer query direta
    }

    // Fallback: query direta
    const transactionsResult = await query(
      `SELECT 
        t.id, t.user_id, t.tipo, t.plano, t.valor, t.status, 
        t.metodo_pagamento, t.referencia_externa, t.notas, 
        t.criado_em, t.atualizado_em,
        p.nome as user_nome, p.email as user_email
       FROM transactions t
       LEFT JOIN profiles p ON p.id = t.user_id
       ORDER BY t.criado_em DESC
       LIMIT $1`,
      [limit]
    );

    return NextResponse.json({
      ok: true,
      transactions: transactionsResult.rows,
    });
  } catch (error) {
    console.error("[Admin Transactions] Erro:", error);
    return NextResponse.json(
      { ok: false, error: "db_error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
