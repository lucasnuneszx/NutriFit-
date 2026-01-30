import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Retornar null durante build se variáveis não estiverem configuradas
  // Isso evita erros durante o build estático
  if (!url || !anonKey) {
    if (typeof window === 'undefined') {
      // Server-side: retornar um cliente mock que não faz nada
      return null as any;
    }
    // Client-side: ainda lançar erro para desenvolvimento
    throw new Error(
      "Supabase env vars ausentes. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createBrowserClient(url, anonKey);
}

