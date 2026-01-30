/**
 * PostgreSQL Database Client
 * Substitui o Supabase por PostgreSQL direto
 */

import { Pool, PoolClient, QueryResult } from 'pg';

let pool: Pool | null = null;

/**
 * Cria ou retorna o pool de conexões PostgreSQL
 */
function getPool(): Pool {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'nutrifit'}`;

  if (!process.env.DATABASE_URL) {
    console.error('[DB] DATABASE_URL não configurada!');
  }

  pool = new Pool({
    connectionString,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000, // Aumentado para 5s
  });

  // Log de erro de conexão
  pool.on('error', (err) => {
    console.error('[DB] Erro inesperado no pool:', err);
  });

  return pool;
}

/**
 * Executa uma query SQL
 */
export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const client = getPool();
  return client.query<T>(text, params);
}

/**
 * Obtém um cliente do pool para transações
 */
export async function getClient(): Promise<PoolClient> {
  const client = getPool();
  return client.connect();
}

/**
 * Fecha todas as conexões (útil para testes)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Wrapper compatível com Supabase para facilitar migração
 */
export class DatabaseClient {
  /**
   * Simula .from() do Supabase
   */
  from(table: string) {
    return {
      select: (columns: string = '*') => ({
        eq: (column: string, value: any) => ({
          maybeSingle: async () => {
            const cols = columns === '*' ? '*' : columns.split(',').map(c => c.trim()).join(', ');
            const result = await query(`SELECT ${cols} FROM ${table} WHERE ${column} = $1`, [value]);
            return { data: result.rows[0] || null, error: null };
          },
          single: async () => {
            const cols = columns === '*' ? '*' : columns.split(',').map(c => c.trim()).join(', ');
            const result = await query(`SELECT ${cols} FROM ${table} WHERE ${column} = $1`, [value]);
            if (result.rows.length === 0) {
              return { data: null, error: { message: 'Not found' } };
            }
            return { data: result.rows[0], error: null };
          },
          order: (column: string, options?: { ascending?: boolean }) => ({
            then: async (callback?: (result: any) => any) => {
              const order = options?.ascending === false ? 'DESC' : 'ASC';
              const cols = columns === '*' ? '*' : columns.split(',').map(c => c.trim()).join(', ');
              const result = await query(
                `SELECT ${cols} FROM ${table} WHERE ${column} = $1 ORDER BY ${column} ${order}`,
                [value]
              );
              const response = { data: result.rows, error: null };
              return callback ? callback(response) : Promise.resolve(response);
            },
          }),
        }),
        maybeSingle: async () => {
          const cols = columns === '*' ? '*' : columns.split(',').map(c => c.trim()).join(', ');
          const result = await query(`SELECT ${cols} FROM ${table}`);
          return { data: result.rows[0] || null, error: null };
        },
        single: async () => {
          const cols = columns === '*' ? '*' : columns.split(',').map(c => c.trim()).join(', ');
          const result = await query(`SELECT ${cols} FROM ${table}`);
          if (result.rows.length === 0) {
            return { data: null, error: { message: 'Not found' } };
          }
          return { data: result.rows[0], error: null };
        },
      }),
      insert: (data: Record<string, unknown>) => ({
        select: (columns: string = '*') => ({
          single: async () => {
            const keys = Object.keys(data);
            const values = Object.values(data);
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
            const cols = columns === '*' ? '*' : columns.split(',').map(c => c.trim()).join(', ');
            const result = await query(
              `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING ${cols}`,
              values
            );
            return { data: result.rows[0], error: null };
          },
        }),
      }),
      update: (data: Record<string, unknown>) => ({
        eq: (column: string, value: any) => ({
          then: async (callback?: (result: any) => any) => {
            const keys = Object.keys(data);
            const values = Object.values(data);
            const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
            const result = await query(
              `UPDATE ${table} SET ${setClause} WHERE ${column} = $${keys.length + 1}`,
              [...values, value]
            );
            const response = { data: result.rows, error: null };
            return callback ? callback(response) : Promise.resolve(response);
          },
        }),
      }),
      upsert: (data: Record<string, unknown>, options?: { onConflict?: string }) => ({
        then: async (callback?: (result: any) => any) => {
          const keys = Object.keys(data);
          const values = Object.values(data);
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
          const conflictColumn = options?.onConflict || 'id';
          const setClause = keys.map((key, i) => `${key} = EXCLUDED.${key}`).join(', ');
          const result = await query(
            `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})
             ON CONFLICT (${conflictColumn}) DO UPDATE SET ${setClause}
             RETURNING *`,
            values
          );
          const response = { data: result.rows, error: null };
          return callback ? callback(response) : Promise.resolve(response);
        },
      }),
    };
  }

  /**
   * Simula auth.getUser() - precisa implementar autenticação JWT
   */
  async auth() {
    return {
      getUser: async () => {
        // TODO: Implementar autenticação JWT
        // Por enquanto, retorna null (precisa implementar)
        return { data: { user: null }, error: null };
      },
    };
  }
}

/**
 * Cria um cliente de banco de dados
 */
export function createDbClient(): DatabaseClient {
  return new DatabaseClient();
}

