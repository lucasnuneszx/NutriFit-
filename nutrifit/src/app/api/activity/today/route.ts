import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

function isoUTC(d: Date) {
  return d.toISOString().slice(0, 10);
}

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

  const today = isoUTC(new Date());

  // garante sessão do dia
  const up = await supabase
    .from("workout_sessions")
    .upsert({ user_id: user.id, performed_on: today }, { onConflict: "user_id,performed_on" })
    .select("id,performed_on")
    .single();

  if (up.error) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: up.error.message },
      { status: 500 },
    );
  }

  const session = up.data;

  const { data: sessionItems, error: siError } = await supabase
    .from("workout_session_items")
    .select("id,workout_item_id,created_at")
    .eq("session_id", session.id)
    .order("created_at", { ascending: false });

  if (siError) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: siError.message },
      { status: 500 },
    );
  }

  const workoutItemIds = (sessionItems ?? []).map((x) => x.workout_item_id);
  const { data: workoutItems, error: wiError } = workoutItemIds.length
    ? await supabase
        .from("workout_items")
        .select("id,group_id,exercise_id,variation_id,exercise_title,variation_title")
        .in("id", workoutItemIds)
    : { data: [], error: null };

  if (wiError) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: wiError.message },
      { status: 500 },
    );
  }

  type WorkoutItem = {
    id: number;
    group_id: string;
    exercise_id: string;
    variation_id: string;
    exercise_title: string | null;
    variation_title: string | null;
  };

  type WorkoutSet = {
    id: number;
    session_item_id: number;
    set_index: number;
    reps: number;
    weight_kg: number;
    rpe: number | null;
    created_at: string;
  };

  const itemById = new Map<number, WorkoutItem>();
  for (const it of (workoutItems ?? []) as WorkoutItem[]) itemById.set(it.id, it);

  const sessionItemIds = (sessionItems ?? []).map((x) => x.id);
  const { data: sets, error: setsError } = sessionItemIds.length
    ? await supabase
        .from("workout_sets")
        .select("id,session_item_id,set_index,reps,weight_kg,rpe,created_at")
        .in("session_item_id", sessionItemIds)
        .order("set_index", { ascending: true })
    : { data: [], error: null };

  if (setsError) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: setsError.message },
      { status: 500 },
    );
  }

  const setsBySessionItem = new Map<number, WorkoutSet[]>();
  for (const s of (sets ?? []) as WorkoutSet[]) {
    const arr = setsBySessionItem.get(s.session_item_id) ?? [];
    arr.push(s);
    setsBySessionItem.set(s.session_item_id, arr);
  }

  const full = (sessionItems ?? []).map((si) => ({
    id: si.id,
    workout_item: itemById.get(si.workout_item_id) ?? null,
    sets: setsBySessionItem.get(si.id) ?? [],
  }));

  return NextResponse.json({ ok: true, today, session, items: full });
}

