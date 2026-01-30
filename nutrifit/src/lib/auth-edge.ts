/**
 * Autenticação para Edge Runtime (Middleware)
 * Usa apenas decodificação básica do JWT (sem verificar assinatura)
 * A verificação completa será feita nas API routes
 */

/**
 * Decodifica JWT sem verificar assinatura (apenas para middleware)
 * Compatível com Edge Runtime
 */
export function verifyTokenOnly(token: string): { userId: string; email: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decodificar payload base64url
    const payload = parts[1];
    
    // Converter base64url para base64
    let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Adicionar padding se necessário
    while (base64.length % 4) {
      base64 += '=';
    }

    // Decodificar usando atob (disponível no Edge Runtime)
    const decodedStr = atob(base64);
    const decoded = JSON.parse(decodedStr);

    // Verificar expiração básica
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return null;
    }

    // Retornar apenas se tiver userId e email
    if (!decoded.userId || !decoded.email) {
      return null;
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
    };
  } catch {
    return null;
  }
}
