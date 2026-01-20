import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";

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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing_env",
        message: "NEXT_PUBLIC_SUPABASE_URL não configurada no .env.local",
      },
      { status: 500 },
    );
  }

  if (!serviceKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing_service_key",
        message: "SUPABASE_SERVICE_ROLE_KEY não configurada no .env.local. Configure para criar usuários.",
      },
      { status: 500 },
    );
  }

  // Usa service_role para criar usuário sem verificação
  const supabase = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Cria o usuário no auth.users (sem verificação de email)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirma email automaticamente
      user_metadata: {
        nome,
        nome_assistente: "Athena", // Default
        created_by_admin: true,
      },
    });

    if (authError || !authData.user) {
      const errorMsg = authError?.message ?? "Erro desconhecido ao criar usuário no Auth";
      // Se o erro for de email já existente, mensagem mais clara
      if (errorMsg.includes("already registered") || errorMsg.includes("User already registered")) {
        return NextResponse.json(
          {
            ok: false,
            error: "email_exists",
            message: "Este email já está cadastrado. Use outro email.",
          },
          { status: 400 },
        );
      }
      return NextResponse.json(
        {
          ok: false,
          error: "auth_error",
          message: errorMsg,
        },
        { status: 500 },
      );
    }

    const userId = authData.user.id;

    // Cria o perfil
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      nome,
      email,
      tipo_plano: tipo_plano,
      nome_assistente: "Athena",
      contagem_streak: 0,
      plano_pausado: false,
      plano_expira_em: plano_expira_em,
      plano_iniciado_em: plano_iniciado_em,
    });

    if (profileError) {
      // Se falhar ao criar perfil, tenta deletar o usuário criado
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        {
          ok: false,
          error: "profile_error",
          message: profileError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: userId,
        email,
        nome,
        tipo_plano,
      },
    });
  } catch (error) {
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
