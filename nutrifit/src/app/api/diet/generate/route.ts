import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { query } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Goal = "cutting" | "bulking";

type DietResult = {
  goal: Goal;
  calories_target: number;
  macros: { protein_g: number; carbs_g: number; fats_g: number };
  meals: Array<{
    title: string;
    items: string[];
    notes: string;
  }>;
  groceries: string[];
  notes: string;
};

export async function POST(request: Request) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

  if (!geminiKey) {
    return NextResponse.json(
      { ok: false, error: "missing_gemini_key" },
      { status: 500 },
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = (await request.json()) as unknown;
  } catch {
    body = null;
  }

  const parsed = body as Partial<{ goal: Goal }>;
  const goal: Goal = parsed.goal === "bulking" ? "bulking" : "cutting";

  // Buscar perfil
  const profileResult = await query<{ nome: string | null; nome_assistente: string | null; tipo_plano: string }>(
    `SELECT nome, nome_assistente, tipo_plano FROM profiles WHERE id = $1`,
    [user.id]
  );
  const profile = profileResult.rows[0];

  const plan = profile?.tipo_plano === "plus" ? "plus" : "free";
  if (plan !== "plus") {
    return NextResponse.json(
      { ok: false, code: "PLUS_REQUIRED" },
      { status: 402 },
    );
  }

  // Buscar biometria
  const bioResult = await query<{
    peso: number | null;
    altura: number | null;
    idade: number | null;
    genero: string | null;
    nivel_atividade: string | null;
    condicoes_medicas: Record<string, unknown> | null;
  }>(
    `SELECT peso, altura, idade, genero, nivel_atividade, condicoes_medicas FROM biometrics WHERE user_id = $1`,
    [user.id]
  );
  const bio = bioResult.rows[0];

  const name = profile?.nome ?? "";
  const assistant = profile?.nome_assistente ?? "Athena";

  // Inicializa o cliente Gemini
  const genAI = new GoogleGenerativeAI(geminiKey);
  
  // Construir prompt detalhado baseado no perfil e objetivo
  const peso = bio?.peso ?? null;
  const altura = bio?.altura ?? null;
  const idade = bio?.idade ?? null;
  const genero = bio?.genero ?? null;
  const nivelAtividade = bio?.nivel_atividade ?? null;
  
  // Calcular IMC se tiver peso e altura
  let imc = null;
  if (peso && altura) {
    const alturaMetros = altura / 100;
    imc = peso / (alturaMetros * alturaMetros);
  }

  const goalText = goal === "cutting" ? "CUTTING (perda de gordura e definição)" : "BULKING (ganho de massa muscular)";
  
  const prompt = `Você é uma nutricionista esportiva de elite e coach de performance (tom cyber-sport, direto e motivador).

Crie uma dieta personalizada para uma pessoa com os seguintes dados:
- Nome: ${name || "Atleta"}
- Objetivo: ${goalText}
- Peso: ${peso ? `${peso}kg` : "não informado"}
- Altura: ${altura ? `${altura}cm` : "não informado"}
- Idade: ${idade ? `${idade} anos` : "não informado"}
- Gênero: ${genero || "não informado"}
- Nível de atividade: ${nivelAtividade || "não informado"}
${imc ? `- IMC: ${imc.toFixed(1)}` : ""}

INSTRUÇÕES:
1. Calcule as calorias diárias necessárias baseado no objetivo (${goalText})
2. Distribua os macronutrientes adequadamente para o objetivo
3. Crie um plano alimentar completo para 1 dia com pelo menos 4-5 refeições
4. Inclua lista de compras com todos os ingredientes necessários
5. Se algum dado estiver faltando, faça suposições conservadoras baseadas em padrões saudáveis e explique em "notes"

Retorne APENAS um JSON válido (sem markdown, sem código, apenas o JSON) com esta estrutura exata:
{
  "goal": "${goal}",
  "calories_target": <número>,
  "macros": {
    "protein_g": <número>,
    "carbs_g": <número>,
    "fats_g": <número>
  },
  "meals": [
    {
      "title": "Nome da refeição",
      "items": ["item 1", "item 2", "..."],
      "notes": "Observações sobre esta refeição"
    }
  ],
  "groceries": ["item 1", "item 2", "..."],
  "notes": "Observações gerais sobre a dieta e recomendações"
}`;

  const model = genAI.getGenerativeModel({ 
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2000,
      responseMimeType: "application/json",
    },
    systemInstruction: "Você é uma nutricionista esportiva especializada em dietas de alta performance. Sempre retorne JSON válido e estruturado.",
  });

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    if (!response) {
      throw new Error("Resposta vazia do Gemini");
    }

    const raw = response.text();
    
    if (!raw || raw.trim().length === 0) {
      throw new Error("Resposta do Gemini está vazia");
    }
    
    let dietResult: DietResult | null = null;
    try {
      dietResult = JSON.parse(raw) as DietResult;
    } catch {
      // Tentar extrair JSON se vier com markdown ou código
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          dietResult = JSON.parse(jsonMatch[0]) as DietResult;
        } catch (e) {
          console.error("Erro ao parsear JSON extraído:", e);
          throw new Error(`Erro ao parsear JSON: ${e instanceof Error ? e.message : String(e)}`);
        }
      } else {
        throw new Error(`Resposta não contém JSON válido. Resposta recebida: ${raw.substring(0, 200)}`);
      }
    }

    if (!dietResult || !dietResult.goal || !dietResult.calories_target || !dietResult.macros || !dietResult.meals) {
      console.error("Dieta inválida recebida:", dietResult);
      return NextResponse.json(
        { ok: false, error: "gemini_invalid_json", raw: raw.substring(0, 500) },
        { status: 502 },
      );
    }

    // Salvar no banco de dados
    const insertResult = await query(
      `INSERT INTO diet_plans (user_id, goal, calories_target, protein_g, carbs_g, fats_g, plan, groceries)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, goal, calories_target, protein_g, carbs_g, fats_g, plan, groceries, created_at`,
      [
        user.id,
        dietResult.goal,
        Math.round(dietResult.calories_target),
        Math.round(dietResult.macros.protein_g),
        Math.round(dietResult.macros.carbs_g),
        Math.round(dietResult.macros.fats_g),
        JSON.stringify({ meals: dietResult.meals, notes: dietResult.notes }),
        JSON.stringify(dietResult.groceries),
      ]
    );

    const saved = insertResult.rows[0];

    return NextResponse.json({ ok: true, saved });
  } catch (error) {
    console.error("Erro na geração de dieta:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // Verificar se é erro de autenticação
    if (errorMsg.includes("API_KEY") || errorMsg.includes("401") || errorMsg.includes("403")) {
      return NextResponse.json(
        {
          ok: false,
          error: "gemini_auth_error",
          message: "Chave da API Gemini inválida ou ausente. Verifique GEMINI_API_KEY no .env.local",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "gemini_error",
        message: `Erro na API Gemini: ${errorMsg}`,
      },
      { status: 500 },
    );
  }
}
