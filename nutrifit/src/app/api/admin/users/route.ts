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

  if (!url) {
    return NextResponse.json({ ok: false, error: "missing_env" }, { status: 500 });
  }

  // Usa service_role para bypass RLS
  const supabase = serviceKey
    ? createClient(url, serviceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

  if (!supabase) {
    // Fallback: usa anon key mas precisa de policy especial ou função
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) {
      return NextResponse.json({ ok: false, error: "missing_keys" }, { status: 500 });
    }

    // Tenta usar função admin_list_profiles via RPC
    const cookieStore = await cookies();
    const client = createClient(url, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    });

    const { data, error } = await client.rpc("admin_list_profiles");

    if (error) {
      return NextResponse.json(
        { ok: false, error: "db_error", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, users: data ?? [] });
  }

  // Com service_role, pode fazer select direto
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id,nome,email,tipo_plano,nome_assistente,contagem_streak,plano_pausado,plano_expira_em,plano_iniciado_em,criado_em,atualizado_em",
    )
    .order("criado_em", { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, users: data ?? [] });
}
