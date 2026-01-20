import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type AddBody = {
  groupId: string;
  exerciseId: string;
  variationId: string;
  exerciseTitle?: string;
  variationTitle?: string;
};

export async function POST(request: Request) {
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

  let body: AddBody | null = null;
  try {
    body = (await request.json()) as AddBody;
  } catch {
    body = null;
  }
  if (!body?.groupId || !body.exerciseId || !body.variationId) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  // encontra/garante plano
  const { data: maybePlan, error } = await supabase
    .from("workout_plans")
    .select("id")
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
      .select("id")
      .single();
    if (created.error) {
      return NextResponse.json(
        { ok: false, error: "db_error", details: created.error.message },
        { status: 500 },
      );
    }
    plan = created.data;
  }

  const inserted = await supabase
    .from("workout_items")
    .insert({
      plan_id: plan.id,
      group_id: body.groupId,
      exercise_id: body.exerciseId,
      variation_id: body.variationId,
      exercise_title: body.exerciseTitle ?? null,
      variation_title: body.variationTitle ?? null,
    })
    .select(
      "id,group_id,exercise_id,variation_id,exercise_title,variation_title,created_at",
    )
    .single();

  if (inserted.error) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: inserted.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, item: inserted.data });
}

export async function DELETE(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const idRaw = searchParams.get("id");
  const id = idRaw ? Number(idRaw) : NaN;
  if (!Number.isFinite(id)) {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  // RLS garante que só o dono consegue deletar
  const { error } = await supabase.from("workout_items").delete().eq("id", id);
  if (error) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

