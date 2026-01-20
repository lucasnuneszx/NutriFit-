import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

type PR = {
  key: string;
  exercise: string;
  variation: string;
  best_weight_kg: number;
  best_reps: number;
  best_e1rm: number;
};

function e1rm(weightKg: number, reps: number) {
  // Epley
  return weightKg * (1 + reps / 30);
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

  // Busca sets recentes e deriva PRs no servidor (simples, mas funcional).
  // Limite para manter performance no MVP.
  const { data: sessions, error: sErr } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(60);

  if (sErr) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: sErr.message },
      { status: 500 },
    );
  }

  const sessionIds = (sessions ?? []).map((s) => s.id as number);
  if (!sessionIds.length) {
    return NextResponse.json({ ok: true, prs: [] as PR[] });
  }

  const { data: sessionItems, error: siErr } = await supabase
    .from("workout_session_items")
    .select("id,workout_item_id")
    .in("session_id", sessionIds);

  if (siErr) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: siErr.message },
      { status: 500 },
    );
  }

  const siIds = (sessionItems ?? []).map((x) => x.id as number);
  const workoutItemIds = Array.from(
    new Set((sessionItems ?? []).map((x) => x.workout_item_id as number)),
  );

  const { data: workoutItems, error: wiErr } = await supabase
    .from("workout_items")
    .select("id,exercise_title,variation_title,exercise_id,variation_id")
    .in("id", workoutItemIds);

  if (wiErr) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: wiErr.message },
      { status: 500 },
    );
  }

  type WorkoutItem = {
    id: number;
    exercise_title: string | null;
    variation_title: string | null;
    exercise_id: string;
    variation_id: string;
  };

  const workoutItemById = new Map<number, WorkoutItem>();
  for (const wi of (workoutItems ?? []) as WorkoutItem[]) {
    workoutItemById.set(wi.id, wi);
  }

  const workoutItemIdBySessionItemId = new Map<number, number>();
  for (const si of sessionItems ?? []) {
    workoutItemIdBySessionItemId.set(si.id as number, si.workout_item_id as number);
  }

  const { data: sets, error: setsErr } = await supabase
    .from("workout_sets")
    .select("session_item_id,reps,weight_kg")
    .in("session_item_id", siIds);

  if (setsErr) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: setsErr.message },
      { status: 500 },
    );
  }

  const bestByKey = new Map<string, PR>();

  for (const s of sets ?? []) {
    const sessionItemId = Number(s.session_item_id);
    const workoutItemId = workoutItemIdBySessionItemId.get(sessionItemId);
    if (!workoutItemId) continue;

    const wi = workoutItemById.get(workoutItemId);

    const reps = Number(s.reps ?? 0);
    const w = Number(s.weight_kg ?? 0);
    if (!Number.isFinite(reps) || !Number.isFinite(w) || reps <= 0 || w <= 0) continue;

    const key = `${wi?.exercise_id ?? "ex"}:${wi?.variation_id ?? "var"}`;
    const ex = wi?.exercise_title ?? wi?.exercise_id ?? "Exercício";
    const vr = wi?.variation_title ?? wi?.variation_id ?? "Variação";
    const score = e1rm(w, reps);

    const current = bestByKey.get(key);
    if (!current || score > current.best_e1rm) {
      bestByKey.set(key, {
        key,
        exercise: ex,
        variation: vr,
        best_weight_kg: Math.round(w * 10) / 10,
        best_reps: Math.round(reps),
        best_e1rm: Math.round(score * 10) / 10,
      });
    }
  }

  const prs = Array.from(bestByKey.values())
    .sort((a, b) => b.best_e1rm - a.best_e1rm)
    .slice(0, 8);

  return NextResponse.json({ ok: true, prs });
}

