import { NextResponse, type NextRequest } from "next/server";
import { verifyTokenOnly } from "@/lib/auth-edge";

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
  // Apenas valida o token JWT, sem acessar banco (Edge Runtime)
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("auth_token")?.value || null;
    const decoded = token ? verifyTokenOnly(token) : null;

    if (!decoded) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/auth";
      redirect.searchParams.set("next", pathname);
      return NextResponse.redirect(redirect);
    }
  }

  // Se já está logado, /auth vira /dashboard
  if (pathname.startsWith("/auth")) {
    const token = request.cookies.get("auth_token")?.value || null;
    const decoded = token ? verifyTokenOnly(token) : null;

    if (decoded) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/dashboard";
      return NextResponse.redirect(redirect);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*", "/admin/:path*"],
};
