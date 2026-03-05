import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.schema';

export type DirectUploadResult = {
  uploadUrl: string;
  cloudflareUid: string;
};

export type CopyFromUrlResult = {
  cloudflareUid: string;
};

export type CloudflareVideoInfo = {
  uid: string;
  status: { state: 'queued' | 'inprogress' | 'ready' | 'error' };
  duration: number | null;
  thumbnail: string | null;
  size: number | null;
  meta: Record<string, string>;
};

@Injectable()
export class CloudflareStreamService {
  private readonly logger = new Logger(CloudflareStreamService.name);
  private readonly baseUrl: string;
  private readonly accountId: string;
  private readonly apiToken: string;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.accountId = this.config.get('CLOUDFLARE_ACCOUNT_ID', { infer: true });
    this.apiToken = this.config.get('CLOUDFLARE_STREAM_API_TOKEN', { infer: true });
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream`;
  }

  async createDirectUploadUrl(args: {
    maxDurationSeconds?: number;
    meta?: Record<string, string>;
  }): Promise<DirectUploadResult> {
    const body = {
      maxDurationSeconds: args.maxDurationSeconds ?? 3600,
      // Simplificado: playback público (sem signed URLs).
      requireSignedURLs: false,
      meta: args.meta ?? {},
    };

    const res = await fetch(`${this.baseUrl}/direct_upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.error(`Cloudflare direct_upload falhou: ${res.status} ${text}`);
      throw new InternalServerErrorException('Falha ao gerar URL de upload no Cloudflare Stream');
    }

    const json = (await res.json()) as {
      result: { uploadURL: string; uid: string };
      success: boolean;
    };

    if (!json.success) {
      throw new InternalServerErrorException('Cloudflare Stream retornou sucesso=false');
    }

    return {
      uploadUrl: json.result.uploadURL,
      cloudflareUid: json.result.uid,
    };
  }

  /**
   * Cria um vídeo no Stream a partir de uma URL pública (Cloudflare baixa o arquivo).
   * Referência: POST /stream/copy
   */
  async copyFromUrl(args: {
    url: string;
    meta?: Record<string, string>;
  }): Promise<CopyFromUrlResult> {
    const res = await fetch(`${this.baseUrl}/copy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: args.url, meta: args.meta ?? {} }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.error(`Cloudflare copy falhou: ${res.status} ${text}`);
      throw new InternalServerErrorException('Falha ao importar vídeo no Cloudflare Stream');
    }

    const json = (await res.json()) as { result: { uid: string }; success: boolean };
    if (!json.success || !json.result?.uid) {
      throw new InternalServerErrorException('Cloudflare Stream retornou sucesso=false no copy');
    }

    return { cloudflareUid: json.result.uid };
  }

  async getVideoInfo(cloudflareUid: string): Promise<CloudflareVideoInfo> {
    const res = await fetch(`${this.baseUrl}/${cloudflareUid}`, {
      headers: { Authorization: `Bearer ${this.apiToken}` },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.error(`Cloudflare getVideoInfo falhou: ${res.status} ${text}`);
      throw new InternalServerErrorException('Falha ao buscar informações do vídeo no Cloudflare');
    }

    const json = (await res.json()) as { result: CloudflareVideoInfo; success: boolean };

    if (!json.success) {
      throw new InternalServerErrorException('Cloudflare Stream retornou sucesso=false');
    }

    return json.result;
  }

  buildPlayerUrl(cloudflareUid: string): string {
    // URL pública padrão do Stream (não requer customer subdomain nem token assinado)
    return `https://iframe.videodelivery.net/${cloudflareUid}`;
  }

  buildThumbnailUrl(cloudflareUid: string): string {
    return `https://videodelivery.net/${cloudflareUid}/thumbnails/thumbnail.jpg`;
  }
}
