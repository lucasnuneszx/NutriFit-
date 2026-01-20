import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

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

  let body: unknown = null;
  try {
    body = (await request.json()) as unknown;
  } catch {
    body = null;
  }

  const parsed = body as Partial<{
    sessionItemId: number;
    reps: number;
    weightKg: number;
    rpe: number | null;
  }>;

  const sessionItemId =
    typeof parsed.sessionItemId === "number" ? parsed.sessionItemId : NaN;
  const reps = typeof parsed.reps === "number" ? parsed.reps : NaN;
  const weightKg = typeof parsed.weightKg === "number" ? parsed.weightKg : NaN;
  const rpe = typeof parsed.rpe === "number" ? parsed.rpe : null;

  if (!Number.isFinite(sessionItemId) || !Number.isFinite(reps) || !Number.isFinite(weightKg)) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  // calcula próximo set_index
  const { data: existing, error: existingError } = await supabase
    .from("workout_sets")
    .select("set_index")
    .eq("session_item_id", sessionItemId)
    .order("set_index", { ascending: false })
    .limit(1);

  if (existingError) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: existingError.message },
      { status: 500 },
    );
  }

  const nextIndex = (existing?.[0]?.set_index ?? 0) + 1;

  const inserted = await supabase
    .from("workout_sets")
    .insert({
      session_item_id: sessionItemId,
      set_index: nextIndex,
      reps,
      weight_kg: weightKg,
      rpe,
    })
    .select("id,session_item_id,set_index,reps,weight_kg,rpe,created_at")
    .single();

  if (inserted.error) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: inserted.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, set: inserted.data });
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

  const { error } = await supabase.from("workout_sets").delete().eq("id", id);
  if (error) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

