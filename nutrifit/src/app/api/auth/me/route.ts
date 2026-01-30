import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Obter usuário atual
 * GET /api/auth/me
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

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        nome_assistente: user.nome_assistente,
        tipo_plano: user.tipo_plano,
      },
    });
  } catch (error) {
    console.error("[Auth Me] Erro:", error);
    return NextResponse.json(
      { ok: false, error: "Erro ao buscar usuário" },
      { status: 500 }
    );
  }
}

