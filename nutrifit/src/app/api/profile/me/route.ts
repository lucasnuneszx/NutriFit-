import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[API /profile/me] Erro ao obter usuário:", userError);
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  console.log("[API /profile/me] Usuário autenticado:", {
    id: user.id,
    email: user.email,
  });

  // Busca o perfil
  // Nota: Se foto_url não existir no banco, remova do select abaixo
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,nome,email,tipo_plano,contagem_streak,foto_url,bio,peso,altura,objetivo")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[API /profile/me] Erro ao buscar perfil:", profileError);
    return NextResponse.json(
      { ok: false, error: "database_error", details: profileError.message },
      { status: 500 },
    );
  }

  // Debug detalhado
  console.log("[API /profile/me] Resultado da query:", {
    userId: user.id,
    profileExists: !!profile,
    profile: profile,
    nome: profile?.nome,
    tipo_plano: profile?.tipo_plano,
    email: profile?.email,
  });

  // Se não tem perfil, tenta criar um básico
  if (!profile) {
    console.log("[API /profile/me] Perfil não encontrado, tentando criar perfil básico...");
    
    // Tenta obter nome do user_metadata
    const meta = user.user_metadata as Record<string, unknown>;
    const metaNome = typeof meta?.nome === "string" ? meta.nome : null;
    
    const newProfile = {
      id: user.id,
      nome: metaNome || null,
      email: user.email || null,
      tipo_plano: "free" as const,
      nome_assistente: null,
      contagem_streak: 0,
    };

    const { data: createdProfile, error: createError } = await supabase
      .from("profiles")
      .insert(newProfile)
      .select()
      .single();

    if (createError) {
      console.error("[API /profile/me] Erro ao criar perfil:", createError);
      // Mesmo com erro, retorna null para o frontend tratar
      return NextResponse.json({
        ok: true,
        user: { id: user.id, email: user.email },
        profile: null,
      });
    }

    console.log("[API /profile/me] Perfil criado:", createdProfile);
    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email },
      profile: createdProfile,
    });
  }

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email },
    profile: profile,
  });
}

export async function PUT(request: Request) {
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
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;

    // Atualizar perfil com os dados enviados
    const { error: updateError } = await supabase
      .from("profiles")
      .update(body)
      .eq("id", user.id);

    if (updateError) {
      console.error("[API /profile/me] Erro ao atualizar perfil:", updateError);
      return NextResponse.json(
        { ok: false, error: "update_failed", details: updateError.message },
        { status: 500 },
      );
    }

    // Buscar o perfil atualizado
    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select()
      .eq("id", user.id)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("[API /profile/me] Erro ao processar request:", error);
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 },
    );
  }
}

