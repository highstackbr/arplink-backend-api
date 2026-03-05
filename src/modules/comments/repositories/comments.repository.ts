import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../../../database/postgres.pool';

export type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  text: string;
  created_at: string;
};

export type CommentViewRow = CommentRow & {
  likes_count: number;
  is_liked: boolean;
  author_name: string | null;
  author_avatar_url: string | null;
};

@Injectable()
export class CommentsRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listByPost(input: { postId: string; viewerId: string }): Promise<CommentViewRow[]> {
    const result = await this.pool.query<CommentViewRow>(
      `
      SELECT
        c.id, c.post_id, c.user_id, c.parent_id, c.text, c.created_at,
        (SELECT COUNT(*)::int FROM comment_likes cl WHERE cl.comment_id = c.id) AS likes_count,
        EXISTS(
          SELECT 1 FROM comment_likes cl2 WHERE cl2.comment_id = c.id AND cl2.user_id = $2
        ) AS is_liked,
        pr.name AS author_name,
        pr.avatar_url AS author_avatar_url
      FROM comments c
      JOIN profiles pr ON pr.id = c.user_id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
      `,
      [input.postId, input.viewerId],
    );
    return result.rows;
  }

  async insert(input: {
    postId: string;
    userId: string;
    text: string;
    parentId?: string | null;
  }): Promise<CommentRow> {
    const result = await this.pool.query<CommentRow>(
      `
      INSERT INTO comments (post_id, user_id, parent_id, text)
      VALUES ($1, $2, $3, $4)
      RETURNING id, post_id, user_id, parent_id, text, created_at
      `,
      [input.postId, input.userId, input.parentId ?? null, input.text],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Falha ao inserir comentário');
    return row;
  }

  async findViewById(input: { commentId: string; viewerId: string }): Promise<CommentViewRow | null> {
    const result = await this.pool.query<CommentViewRow>(
      `
      SELECT
        c.id, c.post_id, c.user_id, c.parent_id, c.text, c.created_at,
        (SELECT COUNT(*)::int FROM comment_likes cl WHERE cl.comment_id = c.id) AS likes_count,
        EXISTS(
          SELECT 1 FROM comment_likes cl2 WHERE cl2.comment_id = c.id AND cl2.user_id = $2
        ) AS is_liked,
        pr.name AS author_name,
        pr.avatar_url AS author_avatar_url
      FROM comments c
      JOIN profiles pr ON pr.id = c.user_id
      WHERE c.id = $1
      LIMIT 1
      `,
      [input.commentId, input.viewerId],
    );
    return result.rows[0] ?? null;
  }
}

