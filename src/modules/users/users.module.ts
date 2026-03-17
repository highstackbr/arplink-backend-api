import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './repositories/users.repository';
import { SupabaseMediaStorage } from '../posts/media/supabase-media-storage';
import { MEDIA_STORAGE } from '../posts/media/media-storage';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1,
      },
    }),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    SupabaseMediaStorage,
    {
      provide: MEDIA_STORAGE,
      useExisting: SupabaseMediaStorage,
    },
  ],
})
export class UsersModule {}

