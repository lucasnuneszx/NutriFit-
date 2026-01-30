import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

  // Debug: log se a chave está presente (sem mostrar o valor completo)
  if (!geminiKey) {
    console.error("[Chat API] GEMINI_API_KEY não encontrada no process.env");
    console.error("[Chat API] Variáveis disponíveis:", Object.keys(process.env).filter(k => k.includes("GEMINI")));
  } else {
    console.log("[Chat API] GEMINI_API_KEY encontrada, modelo:", modelName);
  }

  if (!url || !anonKey) {
    return NextResponse.json({ ok: false, error: "missing_env" }, { status: 500 });
  }
  if (!geminiKey) {
    return NextResponse.json(
      { ok: false, error: "missing_gemini_key", message: "GEMINI_API_KEY não está configurada. Verifique o .env.local e reinicie o servidor." },
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

  // Inicializa o cliente Gemini
  const genAI = new GoogleGenerativeAI(geminiKey);
  
  // System instruction
  const systemInstruction = [
    `Você é ${assistantName}, assistente de IA da plataforma NutriFit+ (estética Cyber-Sport, alta performance).`,
    `O usuário se chama ${userName}.`,
    `Use um tom motivador, direto e com energia de atleta. Seja conciso mas útil.`,
    `Contexto: plano ${plan === "plus" ? "NutriPlus" : "Free"}, biometria: ${bio?.peso ? `${bio.peso}kg` : "—"} / ${bio?.altura ? `${bio.altura}cm` : "—"} / ${bio?.idade ? `${bio.idade}anos` : "—"}.`,
    `Responda sempre em português brasileiro.`,
  ].join("\n");

  // Configuração do modelo
  // Para gemini-3-flash-preview ou gemini-2.0-flash-exp, pode usar thinkingConfig
  // Para gemini-1.5-flash, não há thinking config disponível
  const isAdvancedModel = modelName.includes("gemini-3") || modelName.includes("gemini-2.0");
  
  const modelConfig: {
    model: string;
    generationConfig?: { temperature?: number; maxOutputTokens?: number };
    systemInstruction?: string;
    thinkingConfig?: { thinkingLevel?: string };
  } = {
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
    },
    systemInstruction: systemInstruction,
    // Removendo Google Search temporariamente para reduzir rate limits
    // tools: [
    //   {
    //     googleSearch: {},
    //   },
    // ],
  };

  // Adiciona thinking config apenas para modelos avançados
  // Gemini 3 pode ter rate limits mais restritivos com thinking config
  if (isAdvancedModel && !modelName.includes("gemini-3")) {
    modelConfig.thinkingConfig = {
      thinkingLevel: "HIGH",
    };
  }

  const model = genAI.getGenerativeModel(modelConfig);

  // Constrói o histórico de mensagens
  const history = Array.isArray(parsed.history) ? parsed.history : [];
  const historyMessages = history.slice(-8).map((h) => {
    if (h.role === "user" && typeof h.text === "string" && h.text.trim().length > 0) {
      return { role: "user" as const, parts: [{ text: h.text.trim() }] };
    } else if (h.role === "assistant" && typeof h.text === "string" && h.text.trim().length > 0) {
      // Remove o nome do assistente se estiver presente
      const cleanText = h.text.replace(new RegExp(`^${assistantName}:\\s*`, "i"), "").trim();
      if (cleanText.length > 0) {
        return { role: "model" as const, parts: [{ text: cleanText }] };
      }
    }
    return null;
  }).filter((msg): msg is { role: "user" | "model"; parts: Array<{ text: string }> } => msg !== null);

  console.log("[Chat API] Histórico processado:", historyMessages.length, "mensagens");

  // Inicializar chat com ou sem histórico
  let chat;
  try {
    if (historyMessages.length > 0) {
      chat = model.startChat({
        history: historyMessages,
      });
    } else {
      // Se não há histórico, criar chat sem histórico
      chat = model.startChat();
    }
  } catch (historyError) {
    console.error("[Chat API] Erro ao criar chat com histórico, tentando sem histórico:", historyError);
    // Se falhar com histórico, tenta sem histórico
    chat = model.startChat();
  }

  try {
    console.log("[Chat API] Enviando mensagem para Gemini:", { 
      model: modelName, 
      messageLength: userMessage.length,
      hasHistory: historyMessages.length > 0,
      geminiKeyPresent: !!geminiKey 
    });
    
    const result = await chat.sendMessage(userMessage);
    
    if (!result) {
      console.error("[Chat API] Resultado vazio do Gemini");
      throw new Error("Resultado vazio do Gemini");
    }
    
    const response = await result.response;
    
    if (!response) {
      console.error("[Chat API] Resposta vazia do Gemini");
      throw new Error("Resposta vazia do Gemini");
    }

    const reply = response.text();
    console.log("[Chat API] Resposta recebida, tamanho:", reply?.length || 0);
    
    if (!reply || reply.trim().length === 0) {
      console.error("[Chat API] Resposta do Gemini está vazia");
      throw new Error("Resposta do Gemini está vazia");
    }

    console.log("[Chat API] Resposta processada com sucesso");
    return NextResponse.json({ ok: true, reply });
  } catch (error) {
    console.error("[Chat API] Erro completo:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("[Chat API] Detalhes do erro:", {
      message: errorMsg,
      stack: errorStack?.substring(0, 200),
    });
    
    // Verificar se é erro de autenticação
    if (errorMsg.includes("API_KEY") || errorMsg.includes("401") || errorMsg.includes("403") || errorMsg.includes("PERMISSION_DENIED")) {
      return NextResponse.json(
        {
          ok: false,
          error: "gemini_auth_error",
          message: "Chave da API Gemini inválida ou ausente. Verifique GEMINI_API_KEY no .env.local e reinicie o servidor.",
        },
        { status: 500 },
      );
    }

    // Verificar se é erro de quota/rate limit
    if (
      errorMsg.includes("429") || 
      errorMsg.includes("RESOURCE_EXHAUSTED") || 
      errorMsg.includes("quota") ||
      errorMsg.includes("RATE_LIMIT") ||
      errorMsg.includes("rate limit") ||
      errorMsg.includes("too many requests")
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "gemini_quota_error",
          message: "⏱️ Limite de requisições atingido. Aguarde alguns segundos e tente novamente. A API do Gemini tem limites de uso por minuto.",
        },
        { status: 429 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "gemini_error",
        message: `Erro na API Gemini: ${errorMsg}. Verifique os logs do servidor para mais detalhes.`,
      },
      { status: 500 },
    );
  }
}
