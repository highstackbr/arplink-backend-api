import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../../../database/postgres.pool';

export type InsertPostInput = {
  userId: string;
  content: string;
  mediaUrl: string | null;
  mediaType: 'image' | 'video';
};

export type PostRow = {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: 'image' | 'video' | string;
  created_at: string;
};

export type FeedPostRow = PostRow & {
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  author_id: string;
  author_name: string | null;
  author_username: string | null;
  author_role: string | null;
  author_avatar_url: string | null;
  author_banner_url: string | null;
  author_bio: string | null;
  author_followers: number;
  author_following: number;
};

@Injectable()
export class PostsRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async insertPost(input: InsertPostInput): Promise<PostRow> {
    const result = await this.pool.query<PostRow>(
      `
      insert into posts (user_id, content, media_url, media_type)
      values ($1, $2, $3, $4)
      returning id, user_id, content, media_url, media_type, created_at
      `,
      [input.userId, input.content, input.mediaUrl, input.mediaType],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Falha ao inserir post');
    return row;
  }

  async listFeed(input: {
    viewerId: string;
    limit: number;
    offset: number;
    authorId?: string | null;
    /** Sem `authorId`: `following` = eu + quem sigo; `global` = todos os posts. */
    feedScope?: 'global' | 'following';
  }): Promise<FeedPostRow[]> {
    const feedScope = input.authorId ? 'global' : (input.feedScope ?? 'following');
    const result = await this.pool.query<FeedPostRow>(
      `
      SELECT
        p.id, p.user_id, p.content, p.media_url, p.media_type, p.created_at,
        COALESCE(pl.likes_count, 0)::int AS likes_count,
        COALESCE(cm.comments_count, 0)::int AS comments_count,
        EXISTS(
          SELECT 1
          FROM post_likes l
          WHERE l.post_id = p.id AND l.user_id = $1
        ) AS is_liked,
        pr.id AS author_id,
        pr.name AS author_name,
        pr.username AS author_username,
        pr.user_type AS author_role,
        pr.avatar_url AS author_avatar_url,
        pr.banner_url AS author_banner_url,
        pr.bio AS author_bio,
        (SELECT COUNT(*)::int FROM follows f1 WHERE f1.target_id = pr.id)   AS author_followers,
        (SELECT COUNT(*)::int FROM follows f2 WHERE f2.follower_id = pr.id) AS author_following
      FROM posts p
      JOIN profiles pr ON pr.id = p.user_id
      LEFT JOIN (
        SELECT post_id, COUNT(*)::int AS likes_count
        FROM post_likes
        GROUP BY post_id
      ) pl ON pl.post_id = p.id
      LEFT JOIN (
        SELECT post_id, COUNT(*)::int AS comments_count
        FROM comments
        GROUP BY post_id
      ) cm ON cm.post_id = p.id
      WHERE (
        CASE
          WHEN $4::uuid IS NOT NULL THEN p.user_id = $4::uuid
          WHEN $5::text = 'following' THEN (
            p.user_id = $1::uuid
            OR EXISTS (
              SELECT 1 FROM follows f
              WHERE f.follower_id = $1::uuid AND f.target_id = p.user_id
            )
          )
          ELSE TRUE
        END
      )
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [input.viewerId, input.limit, input.offset, input.authorId ?? null, feedScope],
    );
    return result.rows;
  }

  async findById(postId: string): Promise<Pick<PostRow, 'id' | 'content' | 'media_url' | 'media_type'> | null> {
    const result = await this.pool.query<PostRow>(
      `SELECT id, content, media_url, media_type FROM posts WHERE id = $1`,
      [postId],
    );
    return result.rows[0] ?? null;
  }

  async deletePostByOwner(input: { postId: string; userId: string }): Promise<boolean> {
    const result = await this.pool.query(
      `
      DELETE FROM posts
      WHERE id = $1
        AND user_id = $2
      `,
      [input.postId, input.userId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}

