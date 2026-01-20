import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

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

  try {
    const [usersRes, scansRes, workoutsRes, dietsRes] = await Promise.all([
      supabase.from("profiles").select("id,tipo_plano", { count: "exact" }),
      supabase.from("logs").select("id", { count: "exact" }),
      supabase.from("workout_sessions").select("id", { count: "exact" }),
      supabase.from("diet_plans").select("id", { count: "exact" }),
    ]);

    const users = usersRes.count ?? 0;
    const plus = usersRes.data?.filter((u) => u.tipo_plano === "plus").length ?? 0;
    const free = users - plus;
    const scans = scansRes.count ?? 0;
    const workouts = workoutsRes.count ?? 0;
    const diets = dietsRes.count ?? 0;

    return NextResponse.json({
      ok: true,
      stats: {
        users,
        plus,
        free,
        scans,
        workouts,
        diets,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: String(error) },
      { status: 500 },
    );
  }
}
