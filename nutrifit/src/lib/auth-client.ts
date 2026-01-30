/**
 * Helpers de autenticação para Client Components
 */

'use client';

import { getUserFromToken } from './auth';
import type { User } from './auth';

/**
 * Obtém token dos cookies (client-side)
 */
export function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(c => c.trim().startsWith('auth_token='));
  
  if (!tokenCookie) return null;
  
  return tokenCookie.split('=')[1] || null;
}

/**
 * Obtém usuário autenticado (client-side)
 */
export async function getCurrentUserClient(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) return null;
  
  // Buscar via API (mais seguro)
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

/**
 * Faz logout (remove token)
 */
export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/auth';
}

