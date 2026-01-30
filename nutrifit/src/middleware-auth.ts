import type { NextRequest } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import type { User } from "@/lib/auth";

/**
 * Middleware de autenticação (substitui Supabase)
 */
export async function requireAuth(request: NextRequest): Promise<{ user: User; error: null } | { user: null; error: string }> {
  const token = request.cookies.get('auth_token')?.value || null;

  if (!token) {
    return { user: null, error: 'Não autenticado' };
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return { user: null, error: 'Token inválido' };
  }

  return { user, error: null };
}

