import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseJwksService } from '../jwks/supabase-jwks.service';

@Injectable()
export class SupabaseJwtGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly jwks: SupabaseJwksService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Preparado para o futuro: validação de JWT do Supabase via JWKS + iss/aud.
    // Por enquanto não bloqueia requests: backend pode evoluir endpoint a endpoint.
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers?.authorization as string | undefined;
    if (!authHeader) return true;

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
    if (!token) throw new UnauthorizedException('Authorization inválido');

    // placeholder: quando ativar, validar assinatura com JWKS:
    // - jwksUrl = this.jwks.getJwksUrl()
    // - iss = this.config.get('SUPABASE_JWT_ISSUER')
    // - aud = this.config.get('SUPABASE_JWT_AUDIENCE')
    // e popular req.user.
    void this.config;
    void this.jwks;
    void token;

    return true;
  }
}

