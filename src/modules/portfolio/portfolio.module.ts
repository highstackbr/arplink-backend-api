import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { SupabaseMediaStorage } from '../posts/media/supabase-media-storage';
import { MEDIA_STORAGE } from '../posts/media/media-storage';
import { UsersRepository } from '../users/repositories/users.repository';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { PortfolioRepository } from './repositories/portfolio.repository';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
        files: 4,
      },
    }),
  ],
  controllers: [PortfolioController],
  providers: [
    PortfolioService,
    PortfolioRepository,
    UsersRepository,
    SupabaseMediaStorage,
    {
      provide: MEDIA_STORAGE,
      useExisting: SupabaseMediaStorage,
    },
  ],
})
export class PortfolioModule {}

