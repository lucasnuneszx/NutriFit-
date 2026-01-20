import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ ok: false, error: "invalid_user_id" }, { status: 400 });
  }

  let body: unknown = null;
  try {
    body = (await request.json()) as unknown;
  } catch {
    body = null;
  }

  const parsed = body as Partial<{
    tipo_plano: "free" | "plus";
    plano_pausado: boolean;
    plano_expira_em: string | null;
    plano_iniciado_em: string | null;
    adicionar_dias: number;
  }>;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    return NextResponse.json({ ok: false, error: "missing_env" }, { status: 500 });
  }

  const cookieStore = await cookies();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    return NextResponse.json({ ok: false, error: "missing_keys" }, { status: 500 });
  }

  const client = createClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  });

  // Se tem adicionar_dias, calcula nova data de expiração
  let newExpiraEm: string | null = parsed.plano_expira_em ?? null;
  if (typeof parsed.adicionar_dias === "number" && parsed.adicionar_dias > 0) {
    const { data: current } = await client
      .from("profiles")
      .select("plano_expira_em")
      .eq("id", userId)
      .maybeSingle();

    const baseDate = current?.plano_expira_em
      ? new Date(current.plano_expira_em)
      : new Date();
    const newDate = new Date(baseDate);
    newDate.setDate(newDate.getDate() + parsed.adicionar_dias);
    newExpiraEm = newDate.toISOString();
  }

  // Usa função RPC ou update direto
  if (serviceKey) {
    const supabase = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const updateData: Record<string, unknown> = {};
    if (parsed.tipo_plano !== undefined) updateData.tipo_plano = parsed.tipo_plano;
    if (parsed.plano_pausado !== undefined) updateData.plano_pausado = parsed.plano_pausado;
    if (newExpiraEm !== undefined) updateData.plano_expira_em = newExpiraEm;
    if (parsed.plano_iniciado_em !== undefined)
      updateData.plano_iniciado_em = parsed.plano_iniciado_em;

    const { error } = await supabase.from("profiles").update(updateData).eq("id", userId);

    if (error) {
      return NextResponse.json(
        { ok: false, error: "db_error", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  }

  // Fallback: usa RPC
  const { error } = await client.rpc("admin_update_user_plan", {
    target_user_id: userId,
    new_tipo_plano: parsed.tipo_plano ?? null,
    new_pausado: parsed.plano_pausado ?? null,
    new_expira_em: newExpiraEm ?? null,
    new_iniciado_em: parsed.plano_iniciado_em ?? null,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
