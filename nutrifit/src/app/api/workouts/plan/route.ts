import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ ok: false, error: "missing_env" }, { status: 500 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // 1 plano por usuário (unique)
  const { data: maybePlan, error } = await supabase
    .from("workout_plans")
    .select("id,title,created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: error.message },
      { status: 500 },
    );
  }

  let plan = maybePlan;
  if (!plan) {
    const created = await supabase
      .from("workout_plans")
      .insert({ user_id: user.id, title: "Meu treino" })
      .select("id,title,created_at")
      .single();

    if (created.error) {
      return NextResponse.json(
        { ok: false, error: "db_error", details: created.error.message },
        { status: 500 },
      );
    }
    plan = created.data;
  }

  const { data: items, error: itemsError } = await supabase
    .from("workout_items")
    .select(
      "id,group_id,exercise_id,variation_id,exercise_title,variation_title,created_at",
    )
    .eq("plan_id", plan.id)
    .order("created_at", { ascending: false });

  if (itemsError) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: itemsError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, plan, items: items ?? [] });
}

