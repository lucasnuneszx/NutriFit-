import { NextResponse } from "next/server";
import { createUser, createToken } from "@/lib/auth";
import { setAuthToken } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Criar conta (signup)
 * POST /api/auth/signup
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, nome, nomeAssistente } = body;

    if (!email || !password || !nome) {
      return NextResponse.json(
        { ok: false, error: "Email, senha e nome são obrigatórios" },
        { status: 400 }
      );
    }

    // Criar usuário
    const { user, error } = await createUser(
      email,
      password,
      nome,
      nomeAssistente
    );

    if (error || !user) {
      console.error("[Auth Signup] Erro ao criar usuário:", error);
      
      // Status code baseado no tipo de erro
      let statusCode = 500;
      if (error?.includes('já está cadastrado') || error?.includes('duplicate')) {
        statusCode = 409; // Conflict
      } else if (error?.includes('DATABASE_URL') || error?.includes('conexão')) {
        statusCode = 503; // Service Unavailable
      }
      
      return NextResponse.json(
        { ok: false, error: error || "Erro ao criar usuário" },
        { status: statusCode }
      );
    }

    // Criar token
    const token = createToken(user.id, user.email);

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
    console.error("[Auth Signup] Erro:", error);
    return NextResponse.json(
      { ok: false, error: "Erro ao processar cadastro" },
      { status: 500 }
    );
  }
}

