import { NextResponse } from "next/server";
import { createUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = (await request.json()) as unknown;
  } catch {
    body = null;
  }

  const parsed = body as Partial<{
    email: string;
    password: string;
    nome: string;
    tipo_plano: "free" | "plus";
    plano_expira_em: string | null;
    plano_iniciado_em: string | null;
  }>;

  const email = typeof parsed.email === "string" ? parsed.email.trim() : "";
  const password = typeof parsed.password === "string" ? parsed.password : "";
  const nome = typeof parsed.nome === "string" ? parsed.nome.trim() : "";
  const tipo_plano = parsed.tipo_plano === "plus" ? "plus" : "free";
  const plano_expira_em = typeof parsed.plano_expira_em === "string" && parsed.plano_expira_em ? parsed.plano_expira_em : null;
  const plano_iniciado_em = typeof parsed.plano_iniciado_em === "string" && parsed.plano_iniciado_em ? parsed.plano_iniciado_em : new Date().toISOString();

  if (!email || !password || !nome) {
    return NextResponse.json(
      { ok: false, error: "missing_fields", message: "Email, senha e nome são obrigatórios" },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "invalid_email", message: "Email inválido" },
      { status: 400 },
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { ok: false, error: "weak_password", message: "Senha deve ter no mínimo 6 caracteres" },
      { status: 400 },
    );
  }

  try {
    // Verificar se email já existe
    const existingUser = await query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "email_exists",
          message: "Este email já está cadastrado. Use outro email.",
        },
        { status: 400 },
      );
    }

    // Criar usuário usando a função createUser
    const { user, error: createError } = await createUser(
      email,
      password,
      nome,
      "Athena"
    );

    if (createError || !user) {
      return NextResponse.json(
        {
          ok: false,
          error: "auth_error",
          message: createError || "Erro ao criar usuário",
        },
        { status: 500 },
      );
    }

    // Atualizar perfil com dados adicionais do admin
    await query(
      `UPDATE profiles 
       SET tipo_plano = $1, 
           plano_pausado = false,
           plano_expira_em = $2,
           plano_iniciado_em = $3
       WHERE id = $4`,
      [
        tipo_plano,
        plano_expira_em,
        plano_iniciado_em,
        user.id,
      ]
    );

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        tipo_plano: tipo_plano,
      },
    });
  } catch (error) {
    console.error("[Admin Create User] Erro:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        ok: false,
        error: "unknown_error",
        message: `Erro ao criar usuário: ${errorMessage}`,
      },
      { status: 500 },
    );
  }
}
