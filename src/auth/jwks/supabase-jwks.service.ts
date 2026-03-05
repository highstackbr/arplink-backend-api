import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet } from 'jose';

@Injectable()
export class SupabaseJwksService {
  constructor(private readonly config: ConfigService) {}

  private jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

  getJwksUrl(): string | null {
    const projectUrl = this.config.get<string>('SUPABASE_PROJECT_URL');
    if (!projectUrl) return null;
    return `${projectUrl.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`;
  }

  getRemoteJwks() {
    const jwksUrl = this.getJwksUrl();
    if (!jwksUrl) {
      throw new Error('SUPABASE_PROJECT_URL não configurado (JWKS indisponível)');
    }
    const cached = this.jwksCache.get(jwksUrl);
    if (cached) return cached;

    const remote = createRemoteJWKSet(new URL(jwksUrl));
    this.jwksCache.set(jwksUrl, remote);
    return remote;
  }
}

