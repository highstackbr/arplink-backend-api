import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../../database/postgres.pool';
import type { Role } from '../roles';

@Injectable()
export class UserRolesRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getRoleByUserId(userId: string): Promise<Role | null> {
    // Convenção: uma tabela `profiles` com `id` (uuid do auth.users) e `role` (text).
    // Ajuste o SQL se sua tabela for diferente.
    const result = await this.pool.query<{ role: string }>(
      `select role from profiles where id = $1 limit 1`,
      [userId],
    );
    const raw = result.rows[0]?.role;
    if (!raw) return null;
    if (raw === 'admin' || raw === 'creator' || raw === 'student') return raw;
    return null;
  }
}

