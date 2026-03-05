import * as dns from 'node:dns';
import { Pool } from 'pg';

export const PG_POOL = Symbol('PG_POOL');

const isIPv4 = (host: string) => /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);

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

/**
 * Substitui o host da URL por seu endereço IPv4 para evitar ENETUNREACH em redes sem IPv6.
 */
async function resolveHostToIPv4(databaseUrl: string): Promise<string> {
  try {
    const u = new URL(databaseUrl);
    const host = u.hostname;
    if (!host || isIPv4(host)) return databaseUrl;
    const { address } = await dns.promises.lookup(host, { family: 4 });
    u.hostname = address;
    return u.toString();
  } catch {
    return databaseUrl;
  }
}

export async function createPgPool(
  databaseUrl: string,
  opts?: { sslRejectUnauthorized?: boolean },
): Promise<Pool> {
  const sslRejectUnauthorized = opts?.sslRejectUnauthorized ?? true;
  const withIPv4 = await resolveHostToIPv4(databaseUrl);
  const sanitizedUrl = sanitizeDatabaseUrl(withIPv4);
  return new Pool({
    connectionString: sanitizedUrl,
    ssl: { rejectUnauthorized: sslRejectUnauthorized },
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

