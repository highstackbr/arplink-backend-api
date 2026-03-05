import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { SupabaseMediaStorage } from '../posts/media/supabase-media-storage';
import { MEDIA_STORAGE } from '../posts/media/media-storage';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1,
      },
    }),
  ],
  controllers: [UploadController],
  providers: [
    UploadService,
    SupabaseMediaStorage,
    {
      provide: MEDIA_STORAGE,
      useExisting: SupabaseMediaStorage,
    },
  ],
})
export class UploadModule {}
