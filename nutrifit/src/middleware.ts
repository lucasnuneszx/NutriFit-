import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function isAdminRequest(cookies: ReturnType<typeof NextRequest.prototype.cookies.getAll>) {
  const token = cookies.find((c) => c.name === "admin_token");
  if (!token || !token.value) return false;
  try {
    const decoded = Buffer.from(token.value, "base64").toString("utf-8");
    return decoded.startsWith("admin:");
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Se não tiver env (dev inicial), não bloqueia.
  if (!url || !anonKey) return NextResponse.next();

  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const cookiesList = request.cookies.getAll();

  // Protege /admin (exceto /admin/login) - precisa ser admin
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const admin = isAdminRequest(cookiesList);
    if (!admin) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/admin/login";
      return NextResponse.redirect(redirect);
    }
  }

  // Protege /dashboard (precisa estar logado)
  if (pathname.startsWith("/dashboard") && !user) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/auth";
    redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  // Se já está logado, /auth vira /dashboard
  if (pathname.startsWith("/auth") && user) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/dashboard";
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*", "/admin/:path*"],
};

