import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../../../database/postgres.pool';

export type ShareRow = {
  id: string;
  owner_id: string;
  resource_id: string;
  resource_type: string;
  target_user_id: string | null;
  created_at: string;
};

export type ShareViewRow = ShareRow & {
  owner_name: string | null;
  owner_username: string | null;
  owner_avatar_url: string | null;
};

@Injectable()
export class SharesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async insert(input: {
    ownerId: string;
    resourceId: string;
    resourceType: string;
    targetUserId?: string | null;
  }): Promise<ShareRow> {
    const result = await this.pool.query<ShareRow>(
      `
      INSERT INTO shares (owner_id, resource_id, resource_type, target_user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, owner_id, resource_id, resource_type, target_user_id, created_at
      `,
      [input.ownerId, input.resourceId, input.resourceType, input.targetUserId ?? null],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Falha ao criar compartilhamento');
    return row;
  }

  async listByResource(input: { resourceId: string; resourceType: string }): Promise<ShareViewRow[]> {
    const result = await this.pool.query<ShareViewRow>(
      `
      SELECT
        s.id,
        s.owner_id,
        s.resource_id,
        s.resource_type,
        s.target_user_id,
        s.created_at,
        pr.name AS owner_name,
        pr.username AS owner_username,
        pr.avatar_url AS owner_avatar_url
      FROM shares s
      JOIN profiles pr ON pr.id = s.owner_id
      WHERE s.resource_id = $1
        AND s.resource_type = $2
      ORDER BY s.created_at DESC
      `,
      [input.resourceId, input.resourceType],
    );
    return result.rows;
  }

  /** Lista compartilhamentos recebidos pelo usuário ainda não visitados (viewed_at IS NULL) */
  async listReceivedByUser(targetUserId: string, limit = 50): Promise<ShareViewRow[]> {
    const result = await this.pool.query<ShareViewRow>(
      `
      SELECT
        s.id,
        s.owner_id,
        s.resource_id,
        s.resource_type,
        s.target_user_id,
        s.created_at,
        pr.name AS owner_name,
        pr.username AS owner_username,
        pr.avatar_url AS owner_avatar_url
      FROM shares s
      JOIN profiles pr ON pr.id = s.owner_id
      WHERE s.target_user_id = $1 AND s.viewed_at IS NULL
      ORDER BY s.created_at DESC
      LIMIT $2
      `,
      [targetUserId, limit],
    );
    return result.rows;
  }

  /** Marca um compartilhamento como visitado pelo destinatário (sai da lista) */
  async markViewed(shareId: string, targetUserId: string): Promise<boolean> {
    const result = await this.pool.query(
      `
      UPDATE shares
      SET viewed_at = now()
      WHERE id = $1 AND target_user_id = $2 AND viewed_at IS NULL
      `,
      [shareId, targetUserId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}

