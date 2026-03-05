import { Pool } from 'pg';

export const PG_POOL = Symbol('PG_POOL');

function sanitizeDatabaseUrl(databaseUrl: string): string {
  try {
    const u = new URL(databaseUrl);
    // Deixamos o SSL ser controlado apenas pela opção `ssl` do node-postgres.
    u.searchParams.delete('sslmode');
    u.searchParams.delete('ssl');
    return u.toString();
  } catch {
    return databaseUrl;
  }
}

export function createPgPool(databaseUrl: string, opts?: { sslRejectUnauthorized?: boolean }) {
  const sslRejectUnauthorized = opts?.sslRejectUnauthorized ?? true;
  const sanitizedUrl = sanitizeDatabaseUrl(databaseUrl);
  return new Pool({
    connectionString: sanitizedUrl,
    ssl: { rejectUnauthorized: sslRejectUnauthorized },
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

