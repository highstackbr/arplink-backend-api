import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../../../database/postgres.pool';

export type PortfolioRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  media_urls: any;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class PortfolioRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listByUser(userId: string): Promise<PortfolioRow[]> {
    try {
      const result = await this.pool.query<PortfolioRow>(
        `
        SELECT id, user_id, title, description, media_urls, created_at, updated_at
        FROM portfolio_items
        WHERE user_id = $1
        ORDER BY updated_at DESC
        `,
        [userId],
      );
      return result.rows;
    } catch (err: any) {
      // Ambiente ainda sem migração/schema alinhado: não derruba a aplicação
      // 42P01 = undefined_table, 42703 = undefined_column
      const code = err?.code ?? err?.cause?.code;
      if (code === '42P01' || code === '42703') return [];
      throw err;
    }
  }

  async insert(input: {
    userId: string;
    title: string;
    description?: string | null;
    mediaUrls: string[];
  }): Promise<PortfolioRow> {
    const result = await this.pool.query<PortfolioRow>(
      `
      INSERT INTO portfolio_items (user_id, title, description, media_urls)
      VALUES ($1, $2, $3, $4::text[])
      RETURNING id, user_id, title, description, media_urls, created_at, updated_at
      `,
      [
        input.userId,
        input.title,
        input.description ?? null,
        input.mediaUrls ?? [],
      ],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Falha ao inserir item do portfólio');
    return row;
  }

  async update(input: { id: string; userId: string; title?: string; description?: string }): Promise<PortfolioRow | null> {
    const result = await this.pool.query<PortfolioRow>(
      `
      UPDATE portfolio_items
      SET title = COALESCE($3, title),
          description = COALESCE($4, description),
          updated_at = now()
      WHERE id = $1 AND user_id = $2
      RETURNING id, user_id, title, description, media_urls, created_at, updated_at
      `,
      [input.id, input.userId, input.title ?? null, input.description ?? null],
    );
    return result.rows[0] ?? null;
  }

  async delete(input: { id: string; userId: string }): Promise<boolean> {
    const result = await this.pool.query<{ id: string }>(
      `
      DELETE FROM portfolio_items
      WHERE id = $1 AND user_id = $2
      RETURNING id
      `,
      [input.id, input.userId],
    );
    return Boolean(result.rows[0]);
  }
}

