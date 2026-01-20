import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type Body = {
  draft?: {
    nome?: string;
    email?: string;
    nomeAssistente?: string;
    alturaCm?: number;
    pesoKg?: number;
    idade?: number;
    genero?: string;
    nivelAtividade?: string;
    condicoesMedicas?: Record<string, boolean>;
  };
  plan?: "free" | "plus";
};

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json(
      { ok: false, error: "missing_env" },
      { status: 500 },
    );
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

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const draft = body.draft ?? {};
  const plan = body.plan ?? "free";

  // OBS: essas tabelas devem existir no Supabase (vamos criar o SQL no próximo passo).
  const meta = user.user_metadata as Record<string, unknown>;
  const metaNome = typeof meta?.nome === "string" ? meta.nome : null;
  const metaAssistente =
    typeof meta?.nome_assistente === "string" ? meta.nome_assistente : null;

  const profilePayload = {
    id: user.id,
    nome: draft.nome ?? metaNome,
    email: user.email ?? draft.email ?? null,
    tipo_plano: plan,
    nome_assistente: draft.nomeAssistente ?? metaAssistente,
    contagem_streak: 0,
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" });

  const biometricsPayload = {
    user_id: user.id,
    peso: draft.pesoKg ?? null,
    altura: draft.alturaCm ?? null,
    idade: draft.idade ?? null,
    genero: draft.genero ?? null,
    nivel_atividade: draft.nivelAtividade ?? null,
    condicoes_medicas: draft.condicoesMedicas ?? {},
  };

  const { error: biometricsError } = await supabase
    .from("biometrics")
    .upsert(biometricsPayload, { onConflict: "user_id" });

  if (profileError || biometricsError) {
    return NextResponse.json(
      {
        ok: false,
        error: "db_error",
        details: {
          profile: profileError?.message ?? null,
          biometrics: biometricsError?.message ?? null,
        },
      },
      { status: 200 },
    );
  }

  return NextResponse.json({ ok: true });
}

