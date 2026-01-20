import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "food";
const FREE_WEEKLY_LIMIT = 3;

function safeFilename(name: string) {
  return name.replace(/[^\w.\-]+/g, "-").slice(0, 80);
}

function weekBoundsUTC(now = new Date()) {
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const day = d.getUTCDay(); // 0..6 (Sun..Sat)
  const diffToMonday = (day + 6) % 7; // Monday=0
  const start = new Date(d);
  start.setUTCDate(d.getUTCDate() - diffToMonday);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);

  const weekId = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}-${String(start.getUTCDate()).padStart(2, "0")}`;
  return { start, end, weekId };
}

type FoodAnalysis = {
  dish: string;
  items: string[];
  macros: { calories: number; protein_g: number; carbs_g: number; fats_g: number };
  confidence: number;
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

  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "missing_image" },
      { status: 400 },
    );
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { ok: false, error: "invalid_mime" },
      { status: 400 },
    );
  }

  // plano (default free se não existir profile ainda)
  const { data: profile } = await supabase
    .from("profiles")
    .select("tipo_plano,nome,nome_assistente")
    .eq("id", user.id)
    .maybeSingle();

  const plan = (profile?.tipo_plano === "plus" ? "plus" : "free") as
    | "free"
    | "plus";

  // limite semanal (server-side)
  const { start, end, weekId } = weekBoundsUTC(new Date());
  const { count } = await supabase
    .from("logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("criado_em", start.toISOString())
    .lt("criado_em", end.toISOString());

  const used = count ?? 0;
  if (plan === "free" && used >= FREE_WEEKLY_LIMIT) {
    return NextResponse.json(
      {
        ok: false,
        code: "LIMIT_REACHED",
        plan,
        usage: { weekId, used, limit: FREE_WEEKLY_LIMIT },
      },
      { status: 429 },
    );
  }

  // upload no storage (privado) na pasta do user
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const path = `${user.id}/${Date.now()}-${safeFilename(file.name || "meal")}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) {
    return NextResponse.json(
      { ok: false, error: "storage_upload_failed", details: uploadError.message },
      { status: 500 },
    );
  }

  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 30);

  // OpenAI Vision
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUrl = `data:${file.type};base64,${base64}`;

  const client = new OpenAI({ apiKey: openaiKey });

  const system = [
    "Você é uma IA nutricionista e coach de performance.",
    "Analise a imagem de comida e retorne SOMENTE um JSON válido, sem markdown.",
    "Se houver incerteza, estime e declare confidence menor.",
    "Formato: dish, items[], macros{calories,protein_g,carbs_g,fats_g}, confidence(0..1), notes.",
  ].join("\n");

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "food_analysis",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["dish", "items", "macros", "confidence", "notes"],
          properties: {
            dish: { type: "string" },
            items: { type: "array", items: { type: "string" } },
            macros: {
              type: "object",
              additionalProperties: false,
              required: ["calories", "protein_g", "carbs_g", "fats_g"],
              properties: {
                calories: { type: "number" },
                protein_g: { type: "number" },
                carbs_g: { type: "number" },
                fats_g: { type: "number" },
              },
            },
            confidence: { type: "number" },
            notes: { type: "string" },
          },
        },
      },
    },
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analise esta refeição. Use o nome do usuário: "${profile?.nome ?? ""}". Use o apelido da assistente: "${profile?.nome_assistente ?? ""}".`,
          },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  let analysis: FoodAnalysis | null = null;
  try {
    analysis = JSON.parse(raw) as FoodAnalysis;
  } catch {
    analysis = null;
  }

  if (!analysis) {
    return NextResponse.json(
      { ok: false, error: "openai_invalid_json", raw },
      { status: 502 },
    );
  }

  // grava log
  const { error: logError } = await supabase.from("logs").insert({
    user_id: user.id,
    imagem_url: `${BUCKET}:${path}`,
    dados_alimento: analysis,
  });

  if (logError) {
    return NextResponse.json(
      { ok: false, error: "db_insert_failed", details: logError.message },
      { status: 500 },
    );
  }

  const nextUsed = used + 1;

  return NextResponse.json({
    ok: true,
    plan,
    usage: {
      weekId,
      used: nextUsed,
      limit: plan === "free" ? FREE_WEEKLY_LIMIT : null,
    },
    storage: { bucket: BUCKET, path, signedUrl: signed?.signedUrl ?? null },
    analysis,
  });
}

