import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const BUCKET = "food";

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, "_");
}

export async function POST(request: Request) {
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
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("photo");
  const descricao = form.get("descricao") as string || "Refeição";

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "missing_photo" },
      { status: 400 },
    );
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { ok: false, error: "invalid_mime" },
      { status: 400 },
    );
  }

  // Upload da foto
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const path = `${user.id}/${Date.now()}-${safeFilename(file.name || "meal")}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
    });

  if (uploadError) {
    return NextResponse.json(
      { ok: false, error: "storage_upload_failed", details: uploadError.message },
      { status: 500 },
    );
  }

  // Criar URL pública
  const { data: publicUrl } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  // Salvar no banco de dados
  const { data: mealData, error: insertError } = await supabase
    .from("refeicoes")
    .insert([
      {
        user_id: user.id,
        imagem_url: publicUrl.publicUrl,
        descricao: descricao,
        criado_em: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (insertError) {
    console.error("Erro ao salvar refeição:", insertError);
    return NextResponse.json(
      { ok: false, error: "failed_to_save_meal", details: insertError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    meal: mealData,
  });
}

export async function GET(request: Request) {
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
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { data: meals, error } = await supabase
    .from("refeicoes")
    .select("*")
    .eq("user_id", user.id)
    .order("criado_em", { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, error: "failed_to_fetch_meals", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    meals: meals || [],
  });
}
