import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const BUCKET = "food"; // Usando o mesmo bucket, mas podemos criar um específico depois

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

  // Deletar foto antiga se existir
  const { data: oldProfile } = await supabase
    .from("profiles")
    .select("foto_url")
    .eq("id", user.id)
    .maybeSingle();

  if (oldProfile?.foto_url) {
    // Extrair o path da URL antiga (se for signed URL, precisamos do path original)
    // Por enquanto, vamos apenas fazer upload da nova
  }

  // Upload da nova foto
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const path = `${user.id}/profile-${Date.now()}-${safeFilename(file.name || "photo")}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      upsert: true, // Permite sobrescrever
    });

  if (uploadError) {
    return NextResponse.json(
      { ok: false, error: "storage_upload_failed", details: uploadError.message },
      { status: 500 },
    );
  }

  // Criar URL assinada
  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 ano

  if (!signed) {
    return NextResponse.json(
      { ok: false, error: "failed_to_create_url" },
      { status: 500 },
    );
  }

  // Atualizar perfil com a URL
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ foto_url: signed.signedUrl })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json(
      { ok: false, error: "failed_to_update_profile", details: updateError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    photoUrl: signed.signedUrl,
  });
}
