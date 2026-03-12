import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { z } from 'zod';
import { Public } from './decorators/public.decorator';
import { EmailService } from '../modules/email/email.service';
import { PasswordResetRepository } from './repositories/password-reset.repository';
import { SupabaseAuthAdminService } from './supabase-auth-admin.service';
import * as crypto from 'node:crypto';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(200),
  phone: z.string().optional(),
  username: z.string().optional(),
  avatar_url: z.string().optional(),
  role: z.enum(['pilot', 'company', 'instructor', 'student']).optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

const RESET_TOKEN_EXPIRY_MINUTES = 60;

@Controller('auth')
export class AuthPublicController {
  constructor(
    private readonly supabaseAuthAdmin: SupabaseAuthAdminService,
    private readonly emailService: EmailService,
    private readonly passwordResetRepo: PasswordResetRepository,
  ) {}

  @Public()
  @Post('signup')
  async signup(@Body() body: unknown) {
    const payload = signupSchema.parse(body);
    if (!this.emailService.isEmailConfigured()) {
      throw new BadRequestException(
        'Cadastro temporariamente indisponível. Tente novamente em alguns minutos.',
      );
    }
    const { id } = await this.supabaseAuthAdmin.createUser({
      email: payload.email,
      password: payload.password,
      userMetadata: {
        name: payload.name,
        full_name: payload.name,
        phone: payload.phone ?? null,
        username: payload.username ?? `@${payload.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString(36)}`,
        avatar_url: payload.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name)}&background=0D354D&color=fff`,
        role: payload.role ?? 'pilot',
      },
    });
    await this.emailService.sendSignupWelcome(payload.email, payload.name);
    return { success: true, userId: id };
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() body: unknown) {
    const { email } = forgotPasswordSchema.parse(body);
    if (!this.emailService.isEmailConfigured()) {
      throw new BadRequestException(
        'Recuperação de senha temporariamente indisponível. Tente novamente em alguns minutos.',
      );
    }
    const userId = await this.supabaseAuthAdmin.getUserIdByEmail(email);
    if (!userId) {
      // Não revelar se o e-mail existe ou não (segurança)
      return { success: true, message: 'Se o e-mail existir na base, você receberá as instruções.' };
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);
    await this.passwordResetRepo.create({ token, userId, expiresAt });
    await this.emailService.sendPasswordReset(email, token, RESET_TOKEN_EXPIRY_MINUTES);
    return { success: true, message: 'Se o e-mail existir na base, você receberá as instruções.' };
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() body: unknown) {
    const { token, newPassword } = resetPasswordSchema.parse(body);
    const userId = await this.passwordResetRepo.consumeTokenAndGetUserId(token);
    if (!userId) {
      throw new BadRequestException('Link inválido ou expirado. Solicite uma nova recuperação de senha.');
    }
    await this.supabaseAuthAdmin.updateUserPassword(userId, newPassword);
    return { success: true, message: 'Senha alterada com sucesso.' };
  }
}
