import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SupabaseJwksService } from './jwks/supabase-jwks.service';
import { SupabaseJwtGuard } from './guards/supabase-jwt.guard';
import { SupabaseJwtMiddleware } from './middleware/supabase-jwt.middleware';
import { UserRolesRepository } from './repositories/user-roles.repository';

@Module({
  imports: [DatabaseModule],
  providers: [SupabaseJwksService, SupabaseJwtGuard, SupabaseJwtMiddleware, UserRolesRepository],
  exports: [SupabaseJwksService, SupabaseJwtGuard, SupabaseJwtMiddleware, UserRolesRepository],
})
export class AuthModule {}

