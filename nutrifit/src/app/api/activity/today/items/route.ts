import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

function isoUTC(d: Date) {
  return d.toISOString().slice(0, 10);
}

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

  let body: { workoutItemId?: number } = {};
  try {
    body = (await request.json()) as { workoutItemId?: number };
  } catch {
    body = {};
  }

  const workoutItemId =
    typeof body.workoutItemId === "number" ? body.workoutItemId : NaN;
  if (!Number.isFinite(workoutItemId)) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const today = isoUTC(new Date());

  // garante sessão do dia
  const up = await supabase
    .from("workout_sessions")
    .upsert({ user_id: user.id, performed_on: today }, { onConflict: "user_id,performed_on" })
    .select("id")
    .single();

  if (up.error) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: up.error.message },
      { status: 500 },
    );
  }

  const sessionId = up.data.id;

  const inserted = await supabase
    .from("workout_session_items")
    .insert({ session_id: sessionId, workout_item_id: workoutItemId })
    .select("id,workout_item_id,created_at")
    .single();

  if (inserted.error) {
    // pode ser duplicado (unique). Mantém resposta ok.
    if (String(inserted.error.code) === "23505") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    return NextResponse.json(
      { ok: false, error: "db_error", details: inserted.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, session_item: inserted.data });
}

