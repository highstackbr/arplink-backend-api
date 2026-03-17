import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostsRepository } from './repositories/posts.repository';
import { SupabaseMediaStorage } from './media/supabase-media-storage';
import { MEDIA_STORAGE } from './media/media-storage';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
        files: 3,
      },
    }),
  ],
  controllers: [PostsController],
  providers: [
    PostsService,
    PostsRepository,
    SupabaseMediaStorage,
    {
      provide: MEDIA_STORAGE,
      useExisting: SupabaseMediaStorage,
    },
  ],
  exports: [PostsService],
})
export class PostsModule {}

