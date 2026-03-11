import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../../../database/postgres.pool';

@Injectable()
export class CommentLikesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async commentExists(commentId: string): Promise<boolean> {
    const r = await this.pool.query(
      `SELECT 1 FROM comments WHERE id = $1 LIMIT 1`,
      [commentId],
    );
    return (r.rowCount ?? 0) > 0;
  }

  async like(commentId: string, userId: string): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO comment_likes (comment_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (comment_id, user_id) DO NOTHING
      `,
      [commentId, userId],
    );
  }

  async unlike(commentId: string, userId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2`,
      [commentId, userId],
    );
  }
}

