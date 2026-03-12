import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../../database/postgres.pool';
import * as crypto from 'node:crypto';

@Injectable()
export class PasswordResetRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
  }

  async create(input: { token: string; userId: string; expiresAt: Date }): Promise<void> {
    const tokenHash = this.hashToken(input.token);
    await this.pool.query(
      `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (token_hash) DO UPDATE SET user_id = $2, expires_at = $3`,
      [tokenHash, input.userId, input.expiresAt],
    );
  }

  async consumeTokenAndGetUserId(token: string): Promise<string | null> {
    const tokenHash = this.hashToken(token);
    const result = await this.pool.query<{ user_id: string }>(
      `DELETE FROM password_reset_tokens
       WHERE token_hash = $1 AND expires_at > now()
       RETURNING user_id`,
      [tokenHash],
    );
    return result.rows[0]?.user_id ?? null;
  }
}
