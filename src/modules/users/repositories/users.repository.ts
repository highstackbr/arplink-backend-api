import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../../../database/postgres.pool';

export type ProfileRow = {
  id: string;
  role: string | null;
  auth_role: string | null;
  name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  youtube: string | null;
  twitter: string | null;
  tiktok: string | null;
  phone: string | null;
  followers: number;
  following: number;
};

@Injectable()
export class UsersRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async upsertProfileBase(input: { id: string; role?: string | null }): Promise<ProfileRow> {
    const result = await this.pool.query<ProfileRow>(
      `
      INSERT INTO profiles (id, role)
      VALUES ($1, $2)
      ON CONFLICT (id) DO UPDATE
        SET role = COALESCE(EXCLUDED.role, profiles.role)
      RETURNING
        id,
        user_type AS role,
        role AS auth_role,
        name, username, bio, avatar_url, banner_url,
        facebook, instagram, linkedin, youtube, twitter, tiktok, phone,
        (SELECT COUNT(*)::int FROM follows f1 WHERE f1.target_id = profiles.id)   AS followers,
        (SELECT COUNT(*)::int FROM follows f2 WHERE f2.follower_id = profiles.id) AS following
      `,
      [input.id, input.role ?? null],
    );
    return result.rows[0]!;
  }

  async findById(userId: string): Promise<ProfileRow | null> {
    const result = await this.pool.query<ProfileRow>(
      `
      SELECT
        id,
        user_type AS role,
        role AS auth_role,
        name, username, bio, avatar_url, banner_url,
        facebook, instagram, linkedin, youtube, twitter, tiktok, phone,
        (SELECT COUNT(*)::int FROM follows f1 WHERE f1.target_id = profiles.id)   AS followers,
        (SELECT COUNT(*)::int FROM follows f2 WHERE f2.follower_id = profiles.id) AS following
      FROM profiles
      WHERE id = $1
      LIMIT 1
      `,
      [userId],
    );
    return result.rows[0] ?? null;
  }

  async list(limit = 50): Promise<ProfileRow[]> {
    const result = await this.pool.query<ProfileRow>(
      `
      SELECT
        id,
        user_type AS role,
        role AS auth_role,
        name, username, bio, avatar_url, banner_url,
        facebook, instagram, linkedin, youtube, twitter, tiktok, phone,
        (SELECT COUNT(*)::int FROM follows f1 WHERE f1.target_id = profiles.id)   AS followers,
        (SELECT COUNT(*)::int FROM follows f2 WHERE f2.follower_id = profiles.id) AS following
      FROM profiles
      ORDER BY COALESCE(name, '') ASC
      LIMIT $1
      `,
      [limit],
    );
    return result.rows;
  }

  async updateById(
    userId: string,
    patch: Partial<Omit<ProfileRow, 'id'>>,
  ): Promise<ProfileRow | null> {
    const result = await this.pool.query<ProfileRow>(
      `
      UPDATE profiles
      SET name       = COALESCE($2, name),
          username   = COALESCE($3, username),
          bio        = COALESCE($4, bio),
          avatar_url = COALESCE($5, avatar_url),
          banner_url = COALESCE($6, banner_url),
          facebook   = COALESCE($7, facebook),
          instagram  = COALESCE($8, instagram),
          linkedin   = COALESCE($9, linkedin),
          youtube    = COALESCE($10, youtube),
          twitter    = COALESCE($11, twitter),
          tiktok     = COALESCE($12, tiktok),
          phone      = COALESCE($13, phone)
      WHERE id = $1
      RETURNING
        id,
        user_type AS role,
        role AS auth_role,
        name, username, bio, avatar_url, banner_url,
        facebook, instagram, linkedin, youtube, twitter, tiktok, phone,
        (SELECT COUNT(*)::int FROM follows f1 WHERE f1.target_id = profiles.id)   AS followers,
        (SELECT COUNT(*)::int FROM follows f2 WHERE f2.follower_id = profiles.id) AS following
      `,
      [
        userId,
        patch.name ?? null,
        patch.username ?? null,
        patch.bio ?? null,
        patch.avatar_url ?? null,
        patch.banner_url ?? null,
        patch.facebook ?? null,
        patch.instagram ?? null,
        patch.linkedin ?? null,
        patch.youtube ?? null,
        patch.twitter ?? null,
        patch.tiktok ?? null,
        patch.phone ?? null,
      ],
    );
    return result.rows[0] ?? null;
  }

  async deleteById(userId: string): Promise<boolean> {
    const result = await this.pool.query(
      `
      DELETE FROM profiles
      WHERE id = $1
      `,
      [userId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async search(query: string, limit = 5): Promise<ProfileRow[]> {
    const q = `%${query}%`;
    const result = await this.pool.query<ProfileRow>(
      `
      SELECT
        id,
        user_type AS role,
        role AS auth_role,
        name, username, bio, avatar_url, banner_url,
        facebook, instagram, linkedin, youtube, phone,
        (SELECT COUNT(*)::int FROM follows f1 WHERE f1.target_id = profiles.id)   AS followers,
        (SELECT COUNT(*)::int FROM follows f2 WHERE f2.follower_id = profiles.id) AS following
      FROM profiles
      WHERE (name ILIKE $1 OR username ILIKE $1)
      ORDER BY COALESCE(name, '') ASC
      LIMIT $2
      `,
      [q, limit],
    );
    return result.rows;
  }

  async suggestions(input: { excludeIds: string[]; limit: number }): Promise<ProfileRow[]> {
    const result = await this.pool.query<ProfileRow>(
      `
      SELECT
        id,
        user_type AS role,
        role AS auth_role,
        name, username, bio, avatar_url, banner_url,
        facebook, instagram, linkedin, youtube, phone,
        (SELECT COUNT(*)::int FROM follows f1 WHERE f1.target_id = profiles.id)   AS followers,
        (SELECT COUNT(*)::int FROM follows f2 WHERE f2.follower_id = profiles.id) AS following
      FROM profiles
      WHERE NOT (id = ANY($1::uuid[]))
      ORDER BY random()
      LIMIT $2
      `,
      [input.excludeIds, input.limit],
    );
    return result.rows;
  }
}

