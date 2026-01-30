import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { setAuthToken } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Login
 * POST /api/auth/login
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Autenticar
    const { user, token, error } = await authenticateUser(email, password);

    if (error || !user || !token) {
      return NextResponse.json(
        { ok: false, error: error || "Credenciais inválidas" },
        { status: 401 }
      );
    }

    // Definir cookie
    await setAuthToken(token);

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        nome_assistente: user.nome_assistente,
        tipo_plano: user.tipo_plano,
      },
      token,
    });
  } catch (error) {
    console.error("[Auth Login] Erro:", error);
    return NextResponse.json(
      { ok: false, error: "Erro ao processar login" },
      { status: 500 }
    );
  }
}

