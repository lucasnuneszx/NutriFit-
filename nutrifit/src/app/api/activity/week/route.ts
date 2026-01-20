import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

function isoUTC(d: Date) {
  return d.toISOString().slice(0, 10);
}

function dateFromISO(iso: string) {
  const [y, m, day] = iso.split("-").map((x) => Number(x));
  return new Date(Date.UTC(y, (m ?? 1) - 1, day ?? 1));
}

function addDaysISO(iso: string, delta: number) {
  const d = dateFromISO(iso);
  d.setUTCDate(d.getUTCDate() + delta);
  return isoUTC(d);
}

type DayAgg = {
  date: string;
  workouts: number;
  sets: number;
  volume_kg: number;
  scans: number;
  calories: number;
};

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
  const start = addDaysISO(today, -6);
  const startTs = new Date(`${start}T00:00:00.000Z`).toISOString();
  const endTs = new Date(`${addDaysISO(today, 1)}T00:00:00.000Z`).toISOString();

  const days: DayAgg[] = Array.from({ length: 7 }).map((_, idx) => ({
    date: addDaysISO(start, idx),
    workouts: 0,
    sets: 0,
    volume_kg: 0,
    scans: 0,
    calories: 0,
  }));
  const byDate = new Map(days.map((d) => [d.date, d]));

  // Workouts (sessions)
  const { data: sessions, error: sessErr } = await supabase
    .from("workout_sessions")
    .select("id,performed_on")
    .eq("user_id", user.id)
    .gte("performed_on", start)
    .lte("performed_on", today);

  if (sessErr) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: sessErr.message },
      { status: 500 },
    );
  }

  const sessionIds = (sessions ?? []).map((s) => s.id as number);
  for (const s of sessions ?? []) {
    const date = String(s.performed_on);
    const row = byDate.get(date);
    if (row) row.workouts += 1;
  }

  // Workouts (sets)
  if (sessionIds.length) {
    const { data: sessionItems, error: siErr } = await supabase
      .from("workout_session_items")
      .select("id,session_id")
      .in("session_id", sessionIds);

    if (siErr) {
      return NextResponse.json(
        { ok: false, error: "db_error", details: siErr.message },
        { status: 500 },
      );
    }

    const sessionItemIds = (sessionItems ?? []).map((x) => x.id as number);
    const sessionIdByItem = new Map<number, number>();
    for (const si of sessionItems ?? []) {
      sessionIdByItem.set(si.id as number, si.session_id as number);
    }

    const dateBySessionId = new Map<number, string>();
    for (const s of sessions ?? []) {
      dateBySessionId.set(s.id as number, String(s.performed_on));
    }

    if (sessionItemIds.length) {
      const { data: sets, error: setsErr } = await supabase
        .from("workout_sets")
        .select("session_item_id,reps,weight_kg")
        .in("session_item_id", sessionItemIds);

      if (setsErr) {
        return NextResponse.json(
          { ok: false, error: "db_error", details: setsErr.message },
          { status: 500 },
        );
      }

      for (const st of sets ?? []) {
        const itemId = Number(st.session_item_id);
        const sessId = sessionIdByItem.get(itemId);
        if (!sessId) continue;
        const date = dateBySessionId.get(sessId);
        if (!date) continue;
        const row = byDate.get(date);
        if (!row) continue;

        const reps = Number(st.reps ?? 0);
        const w = Number(st.weight_kg ?? 0);
        row.sets += 1;
        row.volume_kg += reps * w;
      }
    }
  }

  // Scans (logs)
  const { data: logs, error: logsErr } = await supabase
    .from("logs")
    .select("criado_em,dados_alimento")
    .eq("user_id", user.id)
    .gte("criado_em", startTs)
    .lt("criado_em", endTs);

  if (logsErr) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: logsErr.message },
      { status: 500 },
    );
  }

  for (const l of logs ?? []) {
    const date = isoUTC(new Date(String(l.criado_em)));
    const row = byDate.get(date);
    if (!row) continue;
    row.scans += 1;

    const da = l.dados_alimento as unknown;
    const calories = extractCalories(da);
    row.calories += calories;
  }

  // normalize
  for (const d of days) {
    d.volume_kg = Math.round(d.volume_kg * 10) / 10;
    d.calories = Math.round(d.calories);
  }

  return NextResponse.json({ ok: true, start, today, days });
}

function extractCalories(dados: unknown): number {
  if (!dados || typeof dados !== "object") return 0;
  const obj = dados as Record<string, unknown>;
  const macros = obj.macros;
  if (!macros || typeof macros !== "object") return 0;
  const m = macros as Record<string, unknown>;
  const c = m.calories;
  return typeof c === "number" && Number.isFinite(c) ? c : 0;
}

