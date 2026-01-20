import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

function isoUTC(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function addDaysUTC(iso: string, delta: number) {
  const [y, m, day] = iso.split("-").map((x) => Number(x));
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, day ?? 1));
  date.setUTCDate(date.getUTCDate() + delta);
  return isoUTC(date);
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
  const windowDays = 28;
  const startIso = addDaysUTC(today, -(windowDays - 1));
  const startTs = new Date(`${startIso}T00:00:00.000Z`).toISOString();

  // 1) Treinos (datas explícitas)
  const { data: sessions, error: sessionsError } = await supabase
    .from("workout_sessions")
    .select("performed_on")
    .eq("user_id", user.id)
    .gte("performed_on", startIso);

  if (sessionsError) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: sessionsError.message },
      { status: 500 },
    );
  }

  // 2) Scans de refeição (datas derivadas de criado_em em UTC)
  const { data: logs, error: logsError } = await supabase
    .from("logs")
    .select("criado_em")
    .eq("user_id", user.id)
    .gte("criado_em", startTs);

  if (logsError) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: logsError.message },
      { status: 500 },
    );
  }

  const activeDays = new Set<string>();

  for (const s of sessions ?? []) {
    // date vem como string "YYYY-MM-DD"
    if (s.performed_on) activeDays.add(String(s.performed_on));
  }

  for (const l of logs ?? []) {
    if (!l.criado_em) continue;
    const iso = isoUTC(new Date(String(l.criado_em)));
    activeDays.add(iso);
  }

  // streak: dias consecutivos terminando hoje
  let streak = 0;
  let cursor = today;
  while (activeDays.has(cursor)) {
    streak += 1;
    cursor = addDaysUTC(cursor, -1);
  }

  const last7 = Array.from({ length: 7 }).map((_, idx) => {
    const date = addDaysUTC(today, -(6 - idx));
    return { date, did: activeDays.has(date) };
  });

  return NextResponse.json({
    ok: true,
    today,
    streak,
    last7,
    hasWorkoutToday: (sessions ?? []).some((s) => String(s.performed_on) === today),
    hasScanToday: (logs ?? []).some((l) => isoUTC(new Date(String(l.criado_em))) === today),
  });
}

