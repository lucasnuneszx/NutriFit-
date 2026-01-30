/**
 * Sistema de Autenticação Próprio (sem Supabase)
 * Usa JWT + PostgreSQL
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { query } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro-aqui-mude-em-producao';
const JWT_EXPIRES_IN = '7d';

export interface User {
  id: string;
  email: string;
  nome: string;
  nome_assistente: string;
  tipo_plano: 'free' | 'plus';
  criado_em: string;
}

export interface AuthResult {
  user: User | null;
  token: string | null;
  error: string | null;
}

/**
 * Cria hash da senha
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verifica senha
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Cria token JWT
 */
export function createToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verifica e decodifica token JWT
 */
export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Busca usuário por email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await query<User>(
      `SELECT u.id, u.email, u.nome, u.nome_assistente, u.tipo_plano, u.criado_em
       FROM users u
       WHERE u.email = $1`,
      [email]
    );
    return result.rows[0] || null;
  } catch {
    return null;
  }
}

/**
 * Busca usuário por ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const result = await query<User>(
      `SELECT u.id, u.email, u.nome, u.nome_assistente, u.tipo_plano, u.criado_em
       FROM users u
       WHERE u.id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  } catch {
    return null;
  }
}

/**
 * Cria novo usuário
 */
export async function createUser(
  email: string,
  password: string,
  nome: string,
  nomeAssistente?: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    const hashedPassword = await hashPassword(password);
    const userId = randomUUID();

    // Inserir na tabela users
    await query(
      `INSERT INTO users (id, email, password_hash, nome, nome_assistente, tipo_plano, criado_em)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [userId, email, hashedPassword, nome, nomeAssistente || 'Athena', 'free']
    );

    // Buscar usuário criado
    const user = await getUserById(userId);

    return { user, error: null };
  } catch (error) {
    console.error('[Auth] Erro ao criar usuário:', error);
    
    let errorMessage = 'Erro ao criar usuário';
    
    if (error instanceof Error) {
      // Mensagens mais amigáveis para erros comuns
      if (error.message.includes('password authentication failed')) {
        errorMessage = 'Erro de conexão com o banco de dados. Verifique a configuração da DATABASE_URL.';
      } else if (error.message.includes('relation "users" does not exist')) {
        errorMessage = 'Tabela de usuários não encontrada. Execute: npm run db:setup-all';
      } else if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
        errorMessage = 'Este email já está cadastrado.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      user: null,
      error: errorMessage,
    };
  }
}

/**
 * Autentica usuário (login)
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    // Buscar usuário e senha
    const result = await query<{ id: string; email: string; password_hash: string }>(
      `SELECT id, email, password_hash FROM users WHERE email = $1`,
      [email]
    );

    const userData = result.rows[0];
    if (!userData) {
      return { user: null, token: null, error: 'Email ou senha incorretos' };
    }

    // Verificar senha
    const isValid = await verifyPassword(password, userData.password_hash);
    if (!isValid) {
      return { user: null, token: null, error: 'Email ou senha incorretos' };
    }

    // Buscar dados completos do usuário
    const user = await getUserById(userData.id);
    if (!user) {
      return { user: null, token: null, error: 'Erro ao buscar dados do usuário' };
    }

    // Criar token
    const token = createToken(user.id, user.email);

    return { user, token, error: null };
  } catch (error) {
    return {
      user: null,
      token: null,
      error: error instanceof Error ? error.message : 'Erro ao autenticar',
    };
  }
}

/**
 * Obtém usuário do token (para middleware/API routes)
 */
export async function getUserFromToken(token: string | null): Promise<User | null> {
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  return getUserById(decoded.userId);
}

