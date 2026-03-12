import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SupabaseJwksService } from './jwks/supabase-jwks.service';
import { SupabaseJwtGuard } from './guards/supabase-jwt.guard';
import { SupabaseJwtMiddleware } from './middleware/supabase-jwt.middleware';
import { UserRolesRepository } from './repositories/user-roles.repository';
import { PasswordResetRepository } from './repositories/password-reset.repository';
import { SupabaseAuthAdminService } from './supabase-auth-admin.service';
import { AuthPublicController } from './auth-public.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthPublicController],
  providers: [
    SupabaseJwksService,
    SupabaseJwtGuard,
    SupabaseJwtMiddleware,
    UserRolesRepository,
    PasswordResetRepository,
    SupabaseAuthAdminService,
  ],
  exports: [SupabaseJwksService, SupabaseJwtGuard, SupabaseJwtMiddleware, UserRolesRepository],
})
export class AuthModule {}

