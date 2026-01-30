import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

    if (!url || !anonKey) {
      return NextResponse.json({ ok: false, error: "missing_env" }, { status: 500 });
    }
    if (!geminiKey) {
      return NextResponse.json(
        { ok: false, error: "missing_gemini_key" },
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
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { imagem_base64 } = body;

    if (!imagem_base64) {
      return NextResponse.json(
        { ok: false, erro: "Imagem é obrigatória" },
        { status: 400 }
      );
    }

    // Buscar dados do perfil para contexto
    const { data: profile } = await supabase
      .from("profiles")
      .select("nome,nome_assistente")
      .eq("id", user.id)
      .maybeSingle();

    const { data: bio } = await supabase
      .from("biometrics")
      .select("peso,altura,idade,genero")
      .eq("user_id", user.id)
      .maybeSingle();

    const userName = profile?.nome ?? "Atleta";
    const peso = bio?.peso ?? null;
    const altura = bio?.altura ?? null;
    const idade = bio?.idade ?? null;

    // Calcular IMC se tiver dados
    let imc = null;
    if (peso && altura) {
      const alturaMetros = altura / 100;
      imc = peso / (alturaMetros * alturaMetros);
    }

    // Inicializa o cliente Gemini
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2000,
        responseMimeType: "application/json",
      },
    });

    // Extrair base64 da imagem (remover data:image/...;base64, se presente)
    const base64Data = imagem_base64.includes(",") 
      ? imagem_base64.split(",")[1] 
      : imagem_base64;

    // Prompt detalhado para análise corporal
    const prompt = `Você é um Nutricionista Esportivo Elite com 15+ anos de experiência em análise de composição corporal e avaliação física.

Analise esta foto do corpo de ${userName}${peso ? ` (${peso}kg)` : ""}${altura ? `, ${altura}cm` : ""}${idade ? `, ${idade} anos` : ""}${imc ? `, IMC: ${imc.toFixed(1)}` : ""}.

ANÁLISE OBRIGATÓRIA - Retorne JSON com:
1. BIOTIPO: Classifique como "Ectomorfo", "Mesomorfo", "Endomorfo" ou combinado (ex: "Meso-Endomorfo")
2. PERCENTUAL_GORDURA: Estimativa visual do percentual de gordura corporal (ex: "12-15%", "18-22%")
3. IMC_ESTIMADO: Se não tiver dados, estime o IMC baseado na imagem
4. PONTOS_FORTES: Array com 3-4 grupos musculares mais desenvolvidos
5. AREAS_MELHORIA: Array com 2-3 áreas que podem ser melhoradas
6. RECOMENDACOES_TREINO: Array com recomendações específicas de treino
7. RECOMENDACOES_NUTRICAO: Array com recomendações nutricionais
8. MACROS_SUGERIDOS: Objeto com proporção sugerida {proteina: número%, carboidratos: número%, gorduras: número%}
9. OBSERVACOES: Texto com análise geral e próximos passos

Retorne APENAS JSON válido (sem markdown) com esta estrutura:
{
  "biotipo": "string",
  "percentualGordura": "string",
  "imcEstimado": número ou null,
  "pontosFortes": ["string", "string", "string"],
  "areasMelhoria": ["string", "string"],
  "recomendacoesTreino": ["string", "string", "string"],
  "recomendacoesNutricao": ["string", "string"],
  "macros": {"proteina": número, "carboidratos": número, "gorduras": número},
  "observacoes": "string"
}`;

    // Converter base64 para formato do Gemini
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg",
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const raw = response.text();

    let resultado: Record<string, unknown> | null = null;
    try {
      resultado = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      // Tentar extrair JSON se vier com markdown
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        resultado = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Não foi possível parsear a resposta JSON");
      }
    }

    // Adicionar IMC calculado se disponível
    if (imc && !resultado.imcEstimado) {
      resultado.imcEstimado = imc;
    }

    return NextResponse.json({
      ok: true,
      resultado,
    });
  } catch (error) {
    console.error("Erro em /api/bodyscan/analise:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        ok: false, 
        erro: "Erro ao processar a solicitação",
        details: errorMsg,
      },
      { status: 500 }
    );
  }
}
