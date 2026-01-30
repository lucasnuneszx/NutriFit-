import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { query } from "@/lib/db";

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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bootstrap do perfil (criar/atualizar perfil e biometria)
 * POST /api/profile/bootstrap
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    let body: Body = {};
    try {
      body = (await request.json()) as Body;
    } catch {
      body = {};
    }

    const draft = body.draft ?? {};
    const plan = body.plan ?? "free";

    // Criar/atualizar perfil
    const profilePayload = {
      id: user.id,
      nome: draft.nome ?? user.nome,
      email: draft.email ?? user.email,
      tipo_plano: plan,
      nome_assistente: draft.nomeAssistente ?? user.nome_assistente,
      contagem_streak: 0,
    };

    await query(
      `INSERT INTO profiles (id, nome, email, tipo_plano, nome_assistente, contagem_streak)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE
       SET nome = EXCLUDED.nome,
           email = EXCLUDED.email,
           tipo_plano = EXCLUDED.tipo_plano,
           nome_assistente = EXCLUDED.nome_assistente`,
      [
        profilePayload.id,
        profilePayload.nome,
        profilePayload.email,
        profilePayload.tipo_plano,
        profilePayload.nome_assistente,
        profilePayload.contagem_streak,
      ]
    );

    // Criar/atualizar biometria
    const biometricsPayload = {
      user_id: user.id,
      peso: draft.pesoKg ?? null,
      altura: draft.alturaCm ?? null,
      idade: draft.idade ?? null,
      genero: draft.genero ?? null,
      nivel_atividade: draft.nivelAtividade ?? null,
      condicoes_medicas: draft.condicoesMedicas ?? {},
    };

    await query(
      `INSERT INTO biometrics (user_id, peso, altura, idade, genero, nivel_atividade, condicoes_medicas)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE
       SET peso = EXCLUDED.peso,
           altura = EXCLUDED.altura,
           idade = EXCLUDED.idade,
           genero = EXCLUDED.genero,
           nivel_atividade = EXCLUDED.nivel_atividade,
           condicoes_medicas = EXCLUDED.condicoes_medicas`,
      [
        biometricsPayload.user_id,
        biometricsPayload.peso,
        biometricsPayload.altura,
        biometricsPayload.idade,
        biometricsPayload.genero,
        biometricsPayload.nivel_atividade,
        JSON.stringify(biometricsPayload.condicoes_medicas),
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API /profile/bootstrap] Erro:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Erro ao criar perfil",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
