import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../../../database/postgres.pool';

export type MessageRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  voice_url: string | null;
  attachment_url: string | null;
  is_read: boolean;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

@Injectable()
export class MessagesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findBetweenUsers(userA: string, userB: string): Promise<MessageRow[]> {
    const result = await this.pool.query<MessageRow>(
      `
      SELECT id, sender_id, receiver_id, text, voice_url, attachment_url, is_read, created_at, metadata
      FROM messages
      WHERE (sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
      `,
      [userA, userB],
    );
    return result.rows;
  }

  async insert(input: {
    senderId: string;
    receiverId: string;
    text: string;
    voiceUrl?: string;
    attachmentUrl?: string;
    metadata?: Record<string, unknown> | null;
  }): Promise<MessageRow> {
    const result = await this.pool.query<MessageRow>(
      `
      INSERT INTO messages (sender_id, receiver_id, text, voice_url, attachment_url, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, sender_id, receiver_id, text, voice_url, attachment_url, is_read, created_at, metadata
      `,
      [
        input.senderId,
        input.receiverId,
        input.text,
        input.voiceUrl ?? null,
        input.attachmentUrl ?? null,
        input.metadata != null ? JSON.stringify(input.metadata) : null,
      ],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Falha ao inserir mensagem');
    return row;
  }

  async deleteForUser(messageId: string, requesterId: string): Promise<boolean> {
    const result = await this.pool.query(
      `
      DELETE FROM messages
      WHERE id = $1
        AND sender_id = $2
      `,
      [messageId, requesterId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /** Conta mensagens não lidas por remetente (onde receiver_id = currentUser). */
  async countUnreadBySenders(receiverId: string): Promise<{ sender_id: string; count: string }[]> {
    const result = await this.pool.query<{ sender_id: string; count: string }>(
      `
      SELECT sender_id, COUNT(*)::text AS count
      FROM messages
      WHERE receiver_id = $1 AND is_read = false
      GROUP BY sender_id
      `,
      [receiverId],
    );
    return result.rows;
  }

  /** Marca como lidas todas as mensagens de um remetente para o usuário atual. */
  async markAsRead(receiverId: string, senderId: string): Promise<void> {
    await this.pool.query(
      `
      UPDATE messages
      SET is_read = true
      WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false
      `,
      [receiverId, senderId],
    );
  }
}
