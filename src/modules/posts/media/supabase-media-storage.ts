import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import type { MediaStorage, UploadInput } from './media-storage';

@Injectable()
export class SupabaseMediaStorage implements MediaStorage {
  private readonly bucket: string;
  private readonly supabase: ReturnType<typeof createClient>;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_PROJECT_URL');
    const serviceRoleKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceRoleKey) {
      throw new Error('SUPABASE_PROJECT_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios para upload');
    }
    // Se a key for publishable/anon, o upload no Storage normalmente falha por RLS.
    if (serviceRoleKey.startsWith('sb_publishable_')) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY está usando uma key publishable. Use a key "service_role" (secret) do Supabase Dashboard → Settings → API → Project API keys.',
      );
    }

    this.bucket = this.config.get<string>('SUPABASE_STORAGE_BUCKET') ?? 'media';
    this.supabase = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }

  async upload(input: UploadInput): Promise<{ publicUrl: string }> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(input.path, input.data, {
        contentType: input.contentType,
        upsert: false,
      });
    if (error) {
      const msg = typeof (error as any)?.message === 'string' ? (error as any).message : String(error);
      if (msg.toLowerCase().includes('row-level security')) {
        throw new ForbiddenException(
          'Supabase Storage bloqueou o upload por RLS. Verifique se SUPABASE_SERVICE_ROLE_KEY é a chave "service_role" (secret) e se o bucket permite uploads.',
        );
      }
      throw error;
    }

    const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(input.path);
    return { publicUrl: data.publicUrl };
  }
}

