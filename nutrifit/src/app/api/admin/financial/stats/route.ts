import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json({ ok: false, error: "missing_env" }, { status: 500 });
  }

  const cookieStore = await cookies();
  const client = serviceKey
    ? createClient(url, serviceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : createClient(url, anonKey, {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      });

  try {
    // Tenta usar função RPC primeiro
    const { data: rpcData, error: rpcError } = await client.rpc("admin_financial_stats");

    if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
      const stats = rpcData[0] as {
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

    // Fallback: calcula manualmente
    const [transactionsRes, profilesRes] = await Promise.all([
      client.from("transactions").select("valor,status,criado_em"),
      client.from("profiles").select("id,tipo_plano,plano_pausado,plano_expira_em"),
    ]);

    const transactions = transactionsRes.data ?? [];
    const profiles = profilesRes.data ?? [];

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

    const assinaturasCanceladas = profiles.filter((p) => p.tipo_plano === "free").length;

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
    return NextResponse.json(
      { ok: false, error: "db_error", details: String(error) },
      { status: 500 },
    );
  }
}
