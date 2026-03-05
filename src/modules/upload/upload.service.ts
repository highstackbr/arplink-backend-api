import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { MEDIA_STORAGE, type MediaStorage } from '../posts/media/media-storage';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'audio/webm',
  'audio/ogg',
  'audio/mpeg',
  'application/pdf',
]);

function getExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'application/pdf': 'pdf',
  };
  return map[mime] ?? 'bin';
}

@Injectable()
export class UploadService {
  constructor(
    @Inject(MEDIA_STORAGE) private readonly mediaStorage: MediaStorage,
  ) {}

  async uploadFile(userId: string, file: Express.Multer.File): Promise<string> {
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Arquivo excede o limite de 10MB');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(`Tipo de arquivo não permitido: ${file.mimetype}`);
    }

    const ext = getExtFromMime(file.mimetype);
    const path = `chat/${userId}/${Date.now()}.${ext}`;

    const { publicUrl } = await this.mediaStorage.upload({
      path,
      contentType: file.mimetype,
      data: file.buffer,
    });

    return publicUrl;
  }
}
