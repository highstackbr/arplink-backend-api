import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { CreateUserDto } from './dto/create-user.dto';
import { MEDIA_STORAGE, type MediaStorage } from '../posts/media/media-storage';
import { UsersRepository } from './repositories/users.repository';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function getExtFromMime(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'bin';
}

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepo: UsersRepository,
    @Inject(MEDIA_STORAGE) private readonly mediaStorage: MediaStorage,
  ) {}

  private toUser(row: any, email?: string | null) {
    return {
      id: row.id,
      name: row.name ?? '',
      username: row.username ?? '',
      role: (row.role ?? 'student') as any,
      avatar_url: row.avatar_url ?? '',
      banner_url: row.banner_url ?? '',
      bio: row.bio ?? '',
      followers: row.followers ?? 0,
      following: row.following ?? 0,
      facebook: row.facebook ?? undefined,
      instagram: row.instagram ?? undefined,
      linkedin: row.linkedin ?? undefined,
      youtube: row.youtube ?? undefined,
      email: email ?? undefined,
      phone: row.phone ?? undefined,
    };
  }

  async list(limit = 50) {
    const rows = await this.usersRepo.list(limit);
    return rows.map((r) => this.toUser(r));
  }

  async getOrCreateMe(input: { userId: string; role?: string | null; email?: string | null }) {
    const row = await this.usersRepo.upsertProfileBase({ id: input.userId, role: input.role ?? null });
    return this.toUser(row, input.email);
  }

  async getProfile(userId: string) {
    const row = await this.usersRepo.findById(userId);
    return row ? this.toUser(row) : null;
  }

  async updateMe(userId: string, patch: any) {
    await this.usersRepo.upsertProfileBase({ id: userId });
    const updated = await this.usersRepo.updateById(userId, patch);
    return updated ? this.toUser(updated) : null;
  }

  async searchProfiles(query: string, limit = 5) {
    const rows = await this.usersRepo.search(query, limit);
    return rows.map((r) => this.toUser(r));
  }

  async getSuggestions(excludeIds: string[], limit = 5) {
    const unique = Array.from(new Set(excludeIds.filter(Boolean)));
    const rows = await this.usersRepo.suggestions({
      excludeIds: unique.length ? unique : [],
      limit,
    });
    return rows.map((r) => this.toUser(r));
  }

  async uploadBanner(userId: string, file: Express.Multer.File) {
    if (file.size > MAX_FILE_SIZE) throw new BadRequestException('Arquivo excede 10MB');
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Banner deve ser do tipo imagem');
    }

    const ext = getExtFromMime(file.mimetype);
    const path = `banners/${userId}/${Date.now()}.${ext}`;
    const { publicUrl } = await this.mediaStorage.upload({
      path,
      contentType: file.mimetype,
      data: file.buffer,
    });

    await this.usersRepo.upsertProfileBase({ id: userId });
    await this.usersRepo.updateById(userId, { banner_url: publicUrl });
    return publicUrl;
  }

  // Mantido por compatibilidade: inicializa/atualiza o próprio perfil
  async create(userId: string, input: CreateUserDto) {
    await this.usersRepo.upsertProfileBase({ id: userId });
    const updated = await this.usersRepo.updateById(userId, { name: input.name });
    return updated ? this.toUser(updated) : null;
  }
}

