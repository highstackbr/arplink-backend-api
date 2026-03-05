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
};

@Injectable()
export class MessagesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findBetweenUsers(userA: string, userB: string): Promise<MessageRow[]> {
    const result = await this.pool.query<MessageRow>(
      `
      SELECT id, sender_id, receiver_id, text, voice_url, attachment_url, is_read, created_at
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
  }): Promise<MessageRow> {
    const result = await this.pool.query<MessageRow>(
      `
      INSERT INTO messages (sender_id, receiver_id, text, voice_url, attachment_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, sender_id, receiver_id, text, voice_url, attachment_url, is_read, created_at
      `,
      [
        input.senderId,
        input.receiverId,
        input.text,
        input.voiceUrl ?? null,
        input.attachmentUrl ?? null,
      ],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Falha ao inserir mensagem');
    return row;
  }
}
