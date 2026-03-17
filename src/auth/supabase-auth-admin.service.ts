import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAuthAdminService {
  private readonly supabase: ReturnType<typeof createClient>;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_PROJECT_URL');
    const serviceRoleKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceRoleKey) {
      throw new Error('SUPABASE_PROJECT_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
    }
    this.supabase = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }

  /** Cria usuário no Supabase (e-mail já confirmado para login imediato). Não envia e-mail do Supabase. */
  async createUser(params: {
    email: string;
    password: string;
    userMetadata?: Record<string, unknown>;
  }): Promise<{ id: string }> {
    const { data, error } = await this.supabase.auth.admin.createUser({
      email: params.email.trim().toLowerCase(),
      password: params.password,
      email_confirm: true,
      user_metadata: params.userMetadata ?? {},
    });
    if (error) {
      if (error.message?.includes('already') || error.message?.toLowerCase().includes('registered')) {
        throw new BadRequestException('Este e-mail já está em uso. Tente outro ou recupere sua senha.');
      }
      throw new BadRequestException(error.message || 'Falha ao criar usuário.');
    }
    if (!data.user?.id) throw new BadRequestException('Usuário não foi criado.');
    return { id: data.user.id };
  }

  /** Localiza user_id pelo e-mail (lista usuários do Supabase). */
  async getUserIdByEmail(email: string): Promise<string | null> {
    const normalized = email.trim().toLowerCase();
    let page = 1;
    const perPage = 100;
    while (true) {
      const { data, error } = await this.supabase.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error) return null;
      const user = data.users.find((u) => u.email?.toLowerCase() === normalized);
      if (user) return user.id;
      if (data.users.length < perPage) break;
      page++;
    }
    return null;
  }

  /** Atualiza a senha do usuário (uso após validação do token de reset). */
  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    const { error } = await this.supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (error) throw new BadRequestException(error.message || 'Falha ao atualizar senha.');
  }

  /** Remove o usuário do Supabase Auth (impede novo login). Uso ao excluir conta. */
  async deleteUser(userId: string): Promise<void> {
    const { error } = await this.supabase.auth.admin.deleteUser(userId);
    if (error) {
      throw new BadRequestException(error.message || 'Falha ao excluir usuário da autenticação.');
    }
  }
}
