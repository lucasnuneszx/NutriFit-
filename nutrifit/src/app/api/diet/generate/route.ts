import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import OpenAI from "openai";

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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_VISION_MODEL || "gpt-4o";

  if (!url || !anonKey) {
    return NextResponse.json({ ok: false, error: "missing_env" }, { status: 500 });
  }
  if (!openaiKey) {
    return NextResponse.json(
      { ok: false, error: "missing_openai_key" },
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

  let body: unknown = null;
  try {
    body = (await request.json()) as unknown;
  } catch {
    body = null;
  }

  const parsed = body as Partial<{ goal: Goal }>;
  const goal: Goal = parsed.goal === "bulking" ? "bulking" : "cutting";

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome,nome_assistente,tipo_plano")
    .eq("id", user.id)
    .maybeSingle();

  const plan = profile?.tipo_plano === "plus" ? "plus" : "free";
  if (plan !== "plus") {
    return NextResponse.json(
      { ok: false, code: "PLUS_REQUIRED" },
      { status: 402 },
    );
  }

  const { data: bio } = await supabase
    .from("biometrics")
    .select("peso,altura,idade,genero,nivel_atividade,condicoes_medicas")
    .eq("user_id", user.id)
    .maybeSingle();

  const name = profile?.nome ?? "";
  const assistant = profile?.nome_assistente ?? "Athena";

  const client = new OpenAI({ apiKey: openaiKey });

  const system = [
    "Você é uma nutricionista e coach de performance (tom cyber-sport, direto e motivador).",
    "Gere um plano alimentar de 1 dia + lista de compras, baseado em objetivo e biometria.",
    "Retorne SOMENTE JSON válido, sem markdown.",
    "Se biometria estiver incompleta, faça suposições conservadoras e explique em notes.",
    "Formato: goal, calories_target, macros{protein_g,carbs_g,fats_g}, meals[{title,items[],notes}], groceries[], notes.",
  ].join("\n");

  const prompt = {
    user: { nome: name, email: user.email ?? "" },
    assistant: { nickname: assistant },
    goal,
    biometrics: {
      peso: bio?.peso ?? null,
      altura: bio?.altura ?? null,
      idade: bio?.idade ?? null,
      genero: bio?.genero ?? null,
      nivel_atividade: bio?.nivel_atividade ?? null,
      condicoes_medicas: bio?.condicoes_medicas ?? {},
    },
  };

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.35,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "diet_plan",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["goal", "calories_target", "macros", "meals", "groceries", "notes"],
          properties: {
            goal: { type: "string", enum: ["cutting", "bulking"] },
            calories_target: { type: "number" },
            macros: {
              type: "object",
              additionalProperties: false,
              required: ["protein_g", "carbs_g", "fats_g"],
              properties: {
                protein_g: { type: "number" },
                carbs_g: { type: "number" },
                fats_g: { type: "number" },
              },
            },
            meals: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["title", "items", "notes"],
                properties: {
                  title: { type: "string" },
                  items: { type: "array", items: { type: "string" } },
                  notes: { type: "string" },
                },
              },
            },
            groceries: { type: "array", items: { type: "string" } },
            notes: { type: "string" },
          },
        },
      },
    },
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: `Gere a dieta para ${name || "o usuário"} (assistente: ${assistant}). Contexto JSON:\n${JSON.stringify(prompt)}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  let result: DietResult | null = null;
  try {
    result = JSON.parse(raw) as DietResult;
  } catch {
    result = null;
  }

  if (!result) {
    return NextResponse.json(
      { ok: false, error: "openai_invalid_json", raw },
      { status: 502 },
    );
  }

  const insert = await supabase.from("diet_plans").insert({
    user_id: user.id,
    goal: result.goal,
    calories_target: Math.round(result.calories_target),
    protein_g: Math.round(result.macros.protein_g),
    carbs_g: Math.round(result.macros.carbs_g),
    fats_g: Math.round(result.macros.fats_g),
    plan: { meals: result.meals, notes: result.notes },
    groceries: result.groceries,
  }).select("id,goal,calories_target,protein_g,carbs_g,fats_g,plan,groceries,created_at").single();

  if (insert.error) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: insert.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, saved: insert.data });
}

