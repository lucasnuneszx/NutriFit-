import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const [usersRes, scansRes, workoutsRes, dietsRes] = await Promise.all([
      query<{ id: string; tipo_plano: string }>(`SELECT id, tipo_plano FROM profiles`),
      query<{ id: number }>(`SELECT id FROM logs`),
      query<{ id: number }>(`SELECT id FROM workout_sessions`),
      query<{ id: number }>(`SELECT id FROM diet_plans`),
    ]);

    const users = usersRes.rows.length;
    const plus = usersRes.rows.filter((u) => u.tipo_plano === "plus").length;
    const free = users - plus;
    const scans = scansRes.rows.length;
    const workouts = workoutsRes.rows.length;
    const diets = dietsRes.rows.length;

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
    console.error("[Admin Stats] Erro:", error);
    return NextResponse.json(
      { ok: false, error: "db_error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
