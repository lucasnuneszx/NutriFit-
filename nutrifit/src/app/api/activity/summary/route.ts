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

  const { data: session } = await supabase
    .from("workout_sessions")
    .select("id,performed_on")
    .eq("user_id", user.id)
    .eq("performed_on", today)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({
      ok: true,
      today,
      hasWorkout: false,
      stats: { exercises: 0, sets: 0, volume_kg: 0 },
    });
  }

  const { data: sessionItems } = await supabase
    .from("workout_session_items")
    .select("id")
    .eq("session_id", session.id);

  const sessionItemIds = (sessionItems ?? []).map((x) => x.id);
  if (sessionItemIds.length === 0) {
    return NextResponse.json({
      ok: true,
      today,
      hasWorkout: true,
      stats: { exercises: 0, sets: 0, volume_kg: 0 },
    });
  }

  const { data: sets } = await supabase
    .from("workout_sets")
    .select("reps,weight_kg,session_item_id")
    .in("session_item_id", sessionItemIds);

  let setsCount = 0;
  let volume = 0;
  const exerciseSet = new Set<number>();

  for (const s of sets ?? []) {
    setsCount += 1;
    const reps = Number(s.reps ?? 0);
    const w = Number(s.weight_kg ?? 0);
    volume += reps * w;
    exerciseSet.add(Number(s.session_item_id));
  }

  return NextResponse.json({
    ok: true,
    today,
    hasWorkout: true,
    stats: {
      exercises: exerciseSet.size,
      sets: setsCount,
      volume_kg: Math.round(volume * 10) / 10,
    },
  });
}

