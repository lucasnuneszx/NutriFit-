/**
 * Helpers de autenticação para Server Components/API Routes
 */

import { cookies } from 'next/headers';
import { getUserFromToken } from './auth';
import type { User } from './auth';

/**
 * Obtém usuário autenticado a partir dos cookies
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value || null;
  
  if (!token) return null;
  
  return getUserFromToken(token);
}

/**
 * Define token de autenticação nos cookies
 */
export async function setAuthToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/',
  });
}

/**
 * Remove token de autenticação
 */
export async function clearAuthToken() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}

