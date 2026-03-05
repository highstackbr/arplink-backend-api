import * as dns from 'node:dns';
import { Logger } from '@nestjs/common';
import { Pool } from 'pg';

export const PG_POOL = Symbol('PG_POOL');

const logger = new Logger('Database');

const isIPv4 = (host: string) => /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);

/** Retorna uma versão da URL segura para log (senha e query string removidos). */
function urlForLog(url: string): string {
  try {
    const u = new URL(url);
    if (u.password) u.password = '***';
    u.search = '';
    return u.toString();
  } catch {
    return '[URL inválida]';
  }
}

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
    if (!host) {
      logger.warn('resolveHostToIPv4: URL sem hostname');
      return databaseUrl;
    }
    if (isIPv4(host)) {
      logger.log(`resolveHostToIPv4: host já é IPv4 (${host}), mantendo URL`);
      return databaseUrl;
    }
    logger.log(`resolveHostToIPv4: resolvendo host="${host}" para IPv4...`);
    const { address } = await dns.promises.lookup(host, { family: 4 });
    u.hostname = address;
    logger.log(`resolveHostToIPv4: resolvido ${host} -> ${address}`);
    return u.toString();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn(`resolveHostToIPv4: falha ao resolver host (${msg}), usando URL original`);
    return databaseUrl;
  }
}

export async function createPgPool(
  databaseUrl: string,
  opts?: { sslRejectUnauthorized?: boolean },
): Promise<Pool> {
  const sslRejectUnauthorized = opts?.sslRejectUnauthorized ?? true;
  logger.log(`createPgPool: iniciando (sslRejectUnauthorized=${sslRejectUnauthorized})`);
  logger.log(`createPgPool: URL original (resumida) ${urlForLog(databaseUrl)}`);

  const withIPv4 = await resolveHostToIPv4(databaseUrl);
  const sanitizedUrl = sanitizeDatabaseUrl(withIPv4);
  logger.log(`createPgPool: URL final para conexão (resumida) ${urlForLog(sanitizedUrl)}`);

  const pool = new Pool({
    connectionString: sanitizedUrl,
    ssl: { rejectUnauthorized: sslRejectUnauthorized },
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  pool.on('connect', () => logger.debug('Pool: nova conexão estabelecida'));
  pool.on('error', (err) => logger.error(`Pool: erro ${err.message}`, err.stack));

  logger.log('createPgPool: pool criado (conexão sob demanda)');
  return pool;
}

