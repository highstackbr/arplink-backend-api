import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../../../database/postgres.pool';

export type FollowCounts = { followers: number; following: number };

@Injectable()
export class FollowsRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async follow(followerId: string, targetId: string): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO follows (follower_id, target_id)
      VALUES ($1, $2)
      ON CONFLICT (follower_id, target_id) DO NOTHING
      `,
      [followerId, targetId],
    );
  }

  async unfollow(followerId: string, targetId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM follows WHERE follower_id = $1 AND target_id = $2`,
      [followerId, targetId],
    );
  }

  async getFollowers(userId: string, limit = 50): Promise<string[]> {
    const result = await this.pool.query<{ follower_id: string }>(
      `
      SELECT follower_id
      FROM follows
      WHERE target_id = $1
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [userId, limit],
    );
    return result.rows.map((r) => r.follower_id);
  }

  async getFollowing(userId: string, limit = 50): Promise<string[]> {
    const result = await this.pool.query<{ target_id: string }>(
      `
      SELECT target_id
      FROM follows
      WHERE follower_id = $1
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [userId, limit],
    );
    return result.rows.map((r) => r.target_id);
  }

  async getCounts(userId: string): Promise<FollowCounts> {
    const result = await this.pool.query<FollowCounts>(
      `
      SELECT
        (SELECT COUNT(*)::int FROM follows WHERE target_id = $1)  AS followers,
        (SELECT COUNT(*)::int FROM follows WHERE follower_id = $1) AS following
      `,
      [userId],
    );
    return result.rows[0] ?? { followers: 0, following: 0 };
  }
}

