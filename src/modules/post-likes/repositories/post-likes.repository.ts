import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../../../database/postgres.pool';

@Injectable()
export class PostLikesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async like(postId: string, userId: string): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO post_likes (post_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (post_id, user_id) DO NOTHING
      `,
      [postId, userId],
    );
  }

  async unlike(postId: string, userId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2`,
      [postId, userId],
    );
  }
}

