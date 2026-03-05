import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../../../database/postgres.pool';

export type VideoStatus = 'queued' | 'inprogress' | 'ready' | 'error';

export type VideoRow = {
  id: string;
  user_id: string;
  cloudflare_uid: string;
  title: string | null;
  description: string | null;
  duration: number | null;
  status: VideoStatus;
  thumbnail_url: string | null;
  size_bytes: number | null;
  require_signed: boolean;
  created_at: string;
  updated_at: string;
};

export type InsertVideoInput = {
  userId: string;
  cloudflareUid: string;
  title?: string;
  description?: string;
  requireSigned?: boolean;
};

export type UpdateVideoMetadataInput = {
  id: string;
  title?: string;
  description?: string;
};

export type UpdateVideoStatusInput = {
  cloudflareUid: string;
  status: VideoStatus;
  duration?: number | null;
  thumbnailUrl?: string | null;
  sizeBytes?: number | null;
};

@Injectable()
export class VideosRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async insert(input: InsertVideoInput): Promise<VideoRow> {
    const result = await this.pool.query<VideoRow>(
      `
      INSERT INTO videos (user_id, cloudflare_uid, title, description, require_signed)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, cloudflare_uid, title, description,
                duration, status, thumbnail_url, size_bytes, require_signed,
                created_at, updated_at
      `,
      [
        input.userId,
        input.cloudflareUid,
        input.title ?? null,
        input.description ?? null,
        input.requireSigned ?? false,
      ],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Falha ao inserir vídeo');
    return row;
  }

  async findById(id: string): Promise<VideoRow | null> {
    const result = await this.pool.query<VideoRow>(
      `
      SELECT id, user_id, cloudflare_uid, title, description,
             duration, status, thumbnail_url, size_bytes, require_signed,
             created_at, updated_at
      FROM videos
      WHERE id = $1
      `,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async findByCloudflareUid(cloudflareUid: string): Promise<VideoRow | null> {
    const result = await this.pool.query<VideoRow>(
      `
      SELECT id, user_id, cloudflare_uid, title, description,
             duration, status, thumbnail_url, size_bytes, require_signed,
             created_at, updated_at
      FROM videos
      WHERE cloudflare_uid = $1
      `,
      [cloudflareUid],
    );
    return result.rows[0] ?? null;
  }

  async findByUserId(userId: string, limit = 20, offset = 0): Promise<VideoRow[]> {
    const result = await this.pool.query<VideoRow>(
      `
      SELECT id, user_id, cloudflare_uid, title, description,
             duration, status, thumbnail_url, size_bytes, require_signed,
             created_at, updated_at
      FROM videos
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [userId, limit, offset],
    );
    return result.rows;
  }

  async updateMetadata(input: UpdateVideoMetadataInput): Promise<VideoRow | null> {
    const result = await this.pool.query<VideoRow>(
      `
      UPDATE videos
      SET title       = COALESCE($2, title),
          description = COALESCE($3, description),
          updated_at  = now()
      WHERE id = $1
      RETURNING id, user_id, cloudflare_uid, title, description,
                duration, status, thumbnail_url, size_bytes, require_signed,
                created_at, updated_at
      `,
      [input.id, input.title ?? null, input.description ?? null],
    );
    return result.rows[0] ?? null;
  }

  async updateStatus(input: UpdateVideoStatusInput): Promise<VideoRow | null> {
    const result = await this.pool.query<VideoRow>(
      `
      UPDATE videos
      SET status        = $2,
          duration      = COALESCE($3, duration),
          thumbnail_url = COALESCE($4, thumbnail_url),
          size_bytes    = COALESCE($5, size_bytes),
          updated_at    = now()
      WHERE cloudflare_uid = $1
      RETURNING id, user_id, cloudflare_uid, title, description,
                duration, status, thumbnail_url, size_bytes, require_signed,
                created_at, updated_at
      `,
      [
        input.cloudflareUid,
        input.status,
        input.duration ?? null,
        input.thumbnailUrl ?? null,
        input.sizeBytes ?? null,
      ],
    );
    return result.rows[0] ?? null;
  }
}
