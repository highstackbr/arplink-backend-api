import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify } from 'jose';
import { createSecretKey } from 'crypto';
import { SupabaseJwksService } from '../jwks/supabase-jwks.service';
import { UserRolesRepository } from '../repositories/user-roles.repository';
import type { Role } from '../roles';

function getBearerToken(authorization?: string): string | null {
  if (!authorization) return null;
  if (!authorization.startsWith('Bearer ')) return null;
  const token = authorization.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

function safeDecodeJwtPart(part: string): any | null {
  try {
    const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const json = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

@Injectable()
export class SupabaseJwtMiddleware implements NestMiddleware {
  constructor(
    private readonly config: ConfigService,
    private readonly jwks: SupabaseJwksService,
    private readonly userRolesRepo: UserRolesRepository,
  ) {}

  async use(req: any, _res: any, next: (err?: any) => void) {
    const authHeader = req.headers?.authorization as string | undefined;
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(
        JSON.stringify({
          kind: 'auth_header_check',
          method: req.method,
          path: req.originalUrl,
          hasAuthorization: typeof authHeader === 'string' && authHeader.length > 0,
          hasBearer: typeof authHeader === 'string' && authHeader.startsWith('Bearer '),
        }),
      );
    }

    const token = getBearerToken(authHeader);
    if (!token) return next();

    const tokenParts = token.split('.');
    const tokenHeader = tokenParts.length >= 2 ? safeDecodeJwtPart(tokenParts[0]) : null;
    const alg = typeof tokenHeader?.alg === 'string' ? tokenHeader.alg : undefined;

    const issuerConf = this.config.get<string>('SUPABASE_JWT_ISSUER') ?? undefined;
    const audienceConf = this.config.get<string>('SUPABASE_JWT_AUDIENCE') ?? undefined;

    const issuers = [issuerConf, issuerConf?.replace(/\/auth\/v1\/?$/, '')].filter(
      (v): v is string => typeof v === 'string' && v.length > 0,
    );

    const audiences = [audienceConf, 'authenticated'].filter(
      (v): v is string => typeof v === 'string' && v.length > 0,
    );

    const verifyOptions = {
      issuer: issuers.length > 0 ? Array.from(new Set(issuers)) : undefined,
      audience: audiences.length > 0 ? Array.from(new Set(audiences)) : undefined,
    } as const;

    let payload: any;
    try {
      const verified =
        typeof alg === 'string' && alg.startsWith('HS')
          ? await (async () => {
              const secret = this.config.get<string>('SUPABASE_JWT_SECRET') ?? undefined;
              if (!secret) {
                throw new UnauthorizedException(
                  'SUPABASE_JWT_SECRET não configurado (necessário para validar tokens HS256 do Supabase).',
                );
              }
              const key = createSecretKey(Buffer.from(secret, 'utf8'));
              return jwtVerify(token, key, { ...verifyOptions, algorithms: [alg] });
            })()
          : await jwtVerify(token, this.jwks.getRemoteJwks(), verifyOptions);
      payload = verified.payload;
    } catch (err: any) {
      if (process.env.NODE_ENV !== 'production') {
        const parts = token.split('.');
        const header = parts.length >= 2 ? safeDecodeJwtPart(parts[0]) : null;
        const claims = parts.length >= 2 ? safeDecodeJwtPart(parts[1]) : null;
        // eslint-disable-next-line no-console
        console.log(
          JSON.stringify({
            kind: 'jwt_verify_failed',
            method: req?.method,
            path: req?.originalUrl,
            tokenLooksLikeJwt: parts.length === 3,
            errorName: err?.name,
            errorCode: err?.code,
            errorMessage: typeof err?.message === 'string' ? err.message : undefined,
            jwtHeader: header ? { alg: header.alg, kid: header.kid, typ: header.typ } : null,
            jwtClaims: claims
              ? {
                  iss: claims.iss,
                  aud: claims.aud,
                  exp: claims.exp,
                  iat: claims.iat,
                  sub: typeof claims.sub === 'string' ? `${claims.sub.slice(0, 8)}…` : claims.sub,
                }
              : null,
          }),
        );
      }
      return next(err instanceof UnauthorizedException ? err : new UnauthorizedException('Token inválido'));
    }

    const userId = payload?.sub as string | undefined;
    if (!userId) return next(new UnauthorizedException('JWT sem subject (sub)'));

    const email =
      typeof payload.email === 'string'
        ? payload.email
        : typeof payload.user_email === 'string'
          ? payload.user_email
          : undefined;

    let role: Role = 'student';
    try {
      const roleFromDb = await this.userRolesRepo.getRoleByUserId(userId);
      role = roleFromDb ?? 'student';
    } catch (err: any) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log(
          JSON.stringify({
            kind: 'role_lookup_failed',
            method: req?.method,
            path: req?.originalUrl,
            errorName: err?.name,
            errorCode: err?.code,
            errorMessage: typeof err?.message === 'string' ? err.message : undefined,
          }),
        );
      }
      role = 'student';
    }

    req.user = { userId, email, role };
    return next();
  }
}

