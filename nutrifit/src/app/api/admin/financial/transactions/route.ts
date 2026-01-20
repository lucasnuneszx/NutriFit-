import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const limitRaw = searchParams.get("limit");
  const limit = limitRaw ? Math.min(100, Math.max(1, Number(limitRaw))) : 50;

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
    const { data: rpcData, error: rpcError } = await client.rpc("admin_list_transactions");

    if (!rpcError && Array.isArray(rpcData)) {
      return NextResponse.json({
        ok: true,
        transactions: rpcData.slice(0, limit),
      });
    }

    // Fallback: query direta (requer service_role ou policy especial)
    if (serviceKey) {
      const { data, error } = await client
        .from("transactions")
        .select(
          "id,user_id,tipo,plano,valor,status,metodo_pagamento,referencia_externa,notas,criado_em,atualizado_em",
        )
        .order("criado_em", { ascending: false })
        .limit(limit);

      if (error) {
        return NextResponse.json(
          { ok: false, error: "db_error", details: error.message },
          { status: 500 },
        );
      }

      // Busca nomes dos usuários
      const userIds = [...new Set((data ?? []).map((t) => t.user_id))];
      const { data: profiles } = await client
        .from("profiles")
        .select("id,nome,email")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, { nome: p.nome, email: p.email }]),
      );

      const transactions = (data ?? []).map((t) => ({
        ...t,
        user_nome: profileMap.get(t.user_id)?.nome ?? null,
        user_email: profileMap.get(t.user_id)?.email ?? null,
      }));

      return NextResponse.json({ ok: true, transactions });
    }

    return NextResponse.json(
      { ok: false, error: "rpc_failed", details: rpcError?.message },
      { status: 500 },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: String(error) },
      { status: 500 },
    );
  }
}
