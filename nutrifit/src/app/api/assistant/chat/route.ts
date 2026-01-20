import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const parsed = body as Partial<{ message: string; history?: Array<{ role: string; text: string }> }>;
  const userMessage = typeof parsed.message === "string" ? parsed.message.trim() : "";
  if (!userMessage) {
    return NextResponse.json({ ok: false, error: "empty_message" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome,nome_assistente,tipo_plano")
    .eq("id", user.id)
    .maybeSingle();

  const { data: bio } = await supabase
    .from("biometrics")
    .select("peso,altura,idade,genero,nivel_atividade")
    .eq("user_id", user.id)
    .maybeSingle();

  const userName = profile?.nome ?? "Atleta";
  const assistantName = profile?.nome_assistente ?? "Athena";
  const plan = profile?.tipo_plano === "plus" ? "plus" : "free";

  const client = new OpenAI({ apiKey: openaiKey });

  const system = [
    `Você é ${assistantName}, assistente de IA da plataforma NutriFit+ (estética Cyber-Sport, alta performance).`,
    `O usuário se chama ${userName}.`,
    `Use um tom motivador, direto e com energia de atleta. Seja conciso mas útil.`,
    `Contexto: plano ${plan === "plus" ? "NutriPlus" : "Free"}, biometria: ${bio?.peso ? `${bio.peso}kg` : "—"} / ${bio?.altura ? `${bio.altura}cm` : "—"} / ${bio?.idade ? `${bio.idade}anos` : "—"}.`,
    `Responda sempre em português brasileiro.`,
  ].join("\n");

  const history = Array.isArray(parsed.history) ? parsed.history : [];
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: system },
  ];

  for (const h of history.slice(-8)) {
    if (h.role === "user" && typeof h.text === "string") {
      messages.push({ role: "user", content: h.text });
    } else if (h.role === "assistant" && typeof h.text === "string") {
      messages.push({ role: "assistant", content: h.text });
    }
  }

  messages.push({ role: "user", content: userMessage });

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.7,
      max_tokens: 300,
      messages,
    });

    const reply = completion.choices[0]?.message?.content ?? "Desculpe, não consegui processar sua mensagem.";

    return NextResponse.json({ ok: true, reply });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        ok: false,
        error: "openai_error",
        message: `Erro na API OpenAI: ${errorMsg}`,
      },
      { status: 500 },
    );
  }
}
