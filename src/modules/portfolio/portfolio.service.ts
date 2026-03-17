import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { MEDIA_STORAGE, type MediaStorage } from '../posts/media/media-storage';
import { UsersRepository } from '../users/repositories/users.repository';
import { PortfolioRepository } from './repositories/portfolio.repository';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function getExtFromMime(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  if (mime === 'video/mp4') return 'mp4';
  if (mime === 'video/webm') return 'webm';
  return 'bin';
}

@Injectable()
export class PortfolioService {
  constructor(
    private readonly repo: PortfolioRepository,
    private readonly usersRepo: UsersRepository,
    @Inject(MEDIA_STORAGE) private readonly mediaStorage: MediaStorage,
  ) {}

  async listByUser(userId: string) {
    const rows = await this.repo.listByUser(userId);
    return rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      title: r.title,
      description: r.description ?? '',
      media_urls: Array.isArray(r.media_urls)
        ? (r.media_urls as string[])
        : typeof r.media_urls === 'string'
          ? (() => {
              try {
                const parsed = JSON.parse(r.media_urls);
                return Array.isArray(parsed) ? parsed : [];
              } catch {
                return [];
              }
            })()
          : [],
      created_at: r.created_at,
    }));
  }

  async create(input: {
    userId: string;
    title: string;
    description?: string;
    files: Express.Multer.File[];
  }) {
    const title = input.title.trim();
    if (!title) throw new BadRequestException('Título é obrigatório');
    if (!input.files.length) throw new BadRequestException('Envie ao menos 1 arquivo');
    if (input.files.length > 4) throw new BadRequestException('Máximo de 4 arquivos');

    await this.usersRepo.upsertProfileBase({ id: input.userId });

    const urls: string[] = [];
    const now = Date.now();
    for (let i = 0; i < input.files.length; i++) {
      const f = input.files[i]!;
      if (f.size > MAX_FILE_SIZE) throw new BadRequestException('Arquivo excede 10MB');
      const ext = getExtFromMime(f.mimetype);
      const path = `portfolio/${input.userId}/${now}_${i + 1}.${ext}`;
      const { publicUrl } = await this.mediaStorage.upload({
        path,
        contentType: f.mimetype,
        data: f.buffer,
      });
      urls.push(publicUrl);
    }

    const row = await this.repo.insert({
      userId: input.userId,
      title,
      description: (input.description ?? '').trim() || null,
      mediaUrls: urls,
    });

    return {
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      description: row.description ?? '',
      media_urls: urls,
      created_at: row.created_at,
    };
  }

  async update(input: { id: string; userId: string; patch: { title?: string; description?: string } }) {
    const updated = await this.repo.update({
      id: input.id,
      userId: input.userId,
      title: input.patch.title,
      description: input.patch.description,
    });
    if (!updated) throw new BadRequestException('Item não encontrado');
    const mediaUrls =
      Array.isArray(updated.media_urls) ? (updated.media_urls as string[]) : [];
    return {
      id: updated.id,
      user_id: updated.user_id,
      title: updated.title,
      description: updated.description ?? '',
      media_urls: mediaUrls,
      created_at: updated.created_at,
    };
  }

  async delete(input: { id: string; userId: string }) {
    const ok = await this.repo.delete(input);
    if (!ok) {
      throw new BadRequestException('Item não encontrado ou não pertence ao seu portfólio');
    }
    return { ok: true };
  }
}

