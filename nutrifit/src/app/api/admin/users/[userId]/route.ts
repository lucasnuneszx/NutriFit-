import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ ok: false, error: "invalid_user_id" }, { status: 400 });
  }

  let body: unknown = null;
  try {
    body = (await request.json()) as unknown;
  } catch {
    body = null;
  }

  const parsed = body as Partial<{
    tipo_plano: "free" | "plus";
    plano_pausado: boolean;
    plano_expira_em: string | null;
    plano_iniciado_em: string | null;
    adicionar_dias: number;
  }>;

  try {
    // Se tem adicionar_dias, calcula nova data de expiração
    let newExpiraEm: string | null = parsed.plano_expira_em ?? null;
    if (typeof parsed.adicionar_dias === "number" && parsed.adicionar_dias > 0) {
      const currentResult = await query<{ plano_expira_em: string | null }>(
        `SELECT plano_expira_em FROM profiles WHERE id = $1`,
        [userId]
      );

      const current = currentResult.rows[0];
      const baseDate = current?.plano_expira_em
        ? new Date(current.plano_expira_em)
        : new Date();
      const newDate = new Date(baseDate);
      newDate.setDate(newDate.getDate() + parsed.adicionar_dias);
      newExpiraEm = newDate.toISOString();
    }

    // Tenta usar função RPC primeiro
    try {
      await query(
        `SELECT admin_update_user_plan($1, $2, $3, $4, $5)`,
        [
          userId,
          parsed.tipo_plano ?? null,
          parsed.plano_pausado ?? null,
          newExpiraEm ?? null,
          parsed.plano_iniciado_em ?? null,
        ]
      );
      return NextResponse.json({ ok: true });
    } catch {
      // Função RPC não existe, fazer update direto
    }

    // Fallback: update direto
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (parsed.tipo_plano !== undefined) {
      updates.push(`tipo_plano = $${paramIndex}`);
      values.push(parsed.tipo_plano);
      paramIndex++;
    }
    if (parsed.plano_pausado !== undefined) {
      updates.push(`plano_pausado = $${paramIndex}`);
      values.push(parsed.plano_pausado);
      paramIndex++;
    }
    if (newExpiraEm !== undefined) {
      updates.push(`plano_expira_em = $${paramIndex}`);
      values.push(newExpiraEm);
      paramIndex++;
    }
    if (parsed.plano_iniciado_em !== undefined) {
      updates.push(`plano_iniciado_em = $${paramIndex}`);
      values.push(parsed.plano_iniciado_em);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ ok: false, error: "no_updates" }, { status: 400 });
    }

    values.push(userId);

    await query(
      `UPDATE profiles SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Admin Update User] Erro:", error);
    return NextResponse.json(
      { ok: false, error: "db_error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
