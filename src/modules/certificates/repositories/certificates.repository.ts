import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../../../database/postgres.pool';

export type CertificateRow = {
  id: string;
  user_id: string;
  title: string;
  issuer: string;
  issue_date: string | null;
  validation_code: string | null;
  validation_url: string | null;
  created_at: string;
};

@Injectable()
export class CertificatesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listByUser(userId: string): Promise<CertificateRow[]> {
    const result = await this.pool.query<CertificateRow>(
      `
      SELECT id, user_id, title, issuer, issue_date, validation_code, validation_url, created_at
      FROM certificates
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId],
    );
    return result.rows;
  }

  async insert(input: Omit<CertificateRow, 'id' | 'created_at'>): Promise<CertificateRow> {
    const result = await this.pool.query<CertificateRow>(
      `
      INSERT INTO certificates (user_id, title, issuer, issue_date, validation_code, validation_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, user_id, title, issuer, issue_date, validation_code, validation_url, created_at
      `,
      [
        input.user_id,
        input.title,
        input.issuer,
        input.issue_date ?? null,
        input.validation_code ?? null,
        input.validation_url ?? null,
      ],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Falha ao inserir certificado');
    return row;
  }

  async deleteById(id: string, userId: string): Promise<boolean> {
    const result = await this.pool.query<{ id: string }>(
      `
      DELETE FROM certificates
      WHERE id = $1 AND user_id = $2
      RETURNING id
      `,
      [id, userId],
    );
    return Boolean(result.rows[0]);
  }
}

