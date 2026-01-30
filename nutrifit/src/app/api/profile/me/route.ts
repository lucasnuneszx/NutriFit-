import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Obter perfil do usuário atual
 * GET /api/profile/me
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Buscar perfil completo
    const profileResult = await query(
      `SELECT id, nome, email, tipo_plano, contagem_streak, foto_url, bio, peso, altura, objetivo, nome_assistente
       FROM profiles
       WHERE id = $1`,
      [user.id]
    );

    const profile = profileResult.rows[0] || null;

    // Se não tem perfil, criar um básico
    if (!profile) {
      const newProfile = {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo_plano: user.tipo_plano,
        nome_assistente: user.nome_assistente,
        contagem_streak: 0,
      };

      await query(
        `INSERT INTO profiles (id, nome, email, tipo_plano, nome_assistente, contagem_streak)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [
          newProfile.id,
          newProfile.nome,
          newProfile.email,
          newProfile.tipo_plano,
          newProfile.nome_assistente,
          newProfile.contagem_streak,
        ]
      );

      return NextResponse.json({
        ok: true,
        user: { id: user.id, email: user.email },
        profile: newProfile,
      });
    }

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email },
      profile: profile,
    });
  } catch (error) {
    console.error("[API /profile/me] Erro:", error);
    return NextResponse.json(
      { ok: false, error: "Erro ao buscar perfil" },
      { status: 500 }
    );
  }
}

/**
 * Atualizar perfil
 * PUT /api/profile/me
 */
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json() as Record<string, unknown>;

    // Construir query de update dinâmica
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'nome',
      'email',
      'tipo_plano',
      'contagem_streak',
      'foto_url',
      'bio',
      'peso',
      'altura',
      'objetivo',
      'nome_assistente',
    ];

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Nenhum campo para atualizar" },
        { status: 400 }
      );
    }

    values.push(user.id);

    await query(
      `UPDATE profiles
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}`,
      values
    );

    // Buscar perfil atualizado
    const profileResult = await query(
      `SELECT * FROM profiles WHERE id = $1`,
      [user.id]
    );

    return NextResponse.json({
      ok: true,
      profile: profileResult.rows[0],
    });
  } catch (error) {
    console.error("[API /profile/me] Erro:", error);
    return NextResponse.json(
      { ok: false, error: "Erro ao atualizar perfil" },
      { status: 500 }
    );
  }
}
