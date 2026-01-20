import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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

  let body: { plan?: "free" | "plus" } = {};
  try {
    body = (await request.json()) as { plan?: "free" | "plus" };
  } catch {
    body = {};
  }

  const plan = body.plan === "plus" ? "plus" : "free";

  const { error } = await supabase
    .from("profiles")
    .update({ tipo_plano: plan })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: "db_update_failed", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, plan });
}

