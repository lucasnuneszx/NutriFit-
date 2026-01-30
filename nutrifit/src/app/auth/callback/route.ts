import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.redirect(new URL("/auth?error=missing_env", request.url));
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  const response = NextResponse.redirect(new URL("/dashboard", request.url));

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    await supabase.auth.exchangeCodeForSession(code);
  }

  return response;
}

