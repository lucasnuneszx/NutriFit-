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
    // Usar função RPC se existir, senão calcular manualmente
    try {
      const rpcResult = await query(
        `SELECT * FROM admin_financial_stats()`
      );

      if (rpcResult.rows.length > 0) {
        const stats = rpcResult.rows[0] as {
          receita_total: number;
          receita_mes_atual: number;
          receita_mes_anterior: number;
          assinaturas_ativas: number;
          assinaturas_canceladas: number;
          transacoes_pagas: number;
          transacoes_pendentes: number;
        };

        return NextResponse.json({
          ok: true,
          stats: {
            receitaTotal: Number(stats.receita_total ?? 0),
            receitaMesAtual: Number(stats.receita_mes_atual ?? 0),
            receitaMesAnterior: Number(stats.receita_mes_anterior ?? 0),
            assinaturasAtivas: Number(stats.assinaturas_ativas ?? 0),
            assinaturasCanceladas: Number(stats.assinaturas_canceladas ?? 0),
            transacoesPagas: Number(stats.transacoes_pagas ?? 0),
            transacoesPendentes: Number(stats.transacoes_pendentes ?? 0),
          },
        });
      }
    } catch {
      // Função RPC não existe, calcular manualmente
    }

    // Fallback: calcula manualmente
    const [transactionsRes, profilesRes] = await Promise.all([
      query<{ valor: number | string | null; status: string; criado_em: string }>(`SELECT valor, status, criado_em FROM transactions`),
      query<{ id: string; tipo_plano: string; plano_pausado: boolean; plano_expira_em: string | null }>(`SELECT id, tipo_plano, plano_pausado, plano_expira_em FROM profiles`),
    ]);

    const transactions = transactionsRes.rows;
    const profiles = profilesRes.rows;

    const receitaTotal = transactions
      .filter((t) => t.status === "pago")
      .reduce((sum, t) => sum + Number(t.valor ?? 0), 0);

    const now = new Date();
    const mesAtual = new Date(now.getFullYear(), now.getMonth(), 1);
    const mesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const receitaMesAtual = transactions
      .filter(
        (t) =>
          t.status === "pago" &&
          t.criado_em &&
          new Date(t.criado_em) >= mesAtual &&
          new Date(t.criado_em) < new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1),
      )
      .reduce((sum, t) => sum + Number(t.valor ?? 0), 0);

    const receitaMesAnterior = transactions
      .filter(
        (t) =>
          t.status === "pago" &&
          t.criado_em &&
          new Date(t.criado_em) >= mesAnterior &&
          new Date(t.criado_em) < mesAtual,
      )
      .reduce((sum, t) => sum + Number(t.valor ?? 0), 0);

    const assinaturasAtivas = profiles.filter(
      (p) =>
        p.tipo_plano === "plus" &&
        !p.plano_pausado &&
        (!p.plano_expira_em || new Date(p.plano_expira_em) > now),
    ).length;

    const assinaturasCanceladas = profiles.filter(
      (p) => p.tipo_plano === "free"
    ).length;

    const transacoesPagas = transactions.filter((t) => t.status === "pago").length;
    const transacoesPendentes = transactions.filter((t) => t.status === "pendente").length;

    return NextResponse.json({
      ok: true,
      stats: {
        receitaTotal: receitaTotal,
        receitaMesAtual: receitaMesAtual,
        receitaMesAnterior: receitaMesAnterior,
        assinaturasAtivas: assinaturasAtivas,
        assinaturasCanceladas: assinaturasCanceladas,
        transacoesPagas: transacoesPagas,
        transacoesPendentes: transacoesPendentes,
      },
    });
  } catch (error) {
    console.error("[Admin Financial Stats] Erro:", error);
    return NextResponse.json(
      { ok: false, error: "db_error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
