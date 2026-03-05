import { Module } from '@nestjs/common';
import { CloudflareStreamService } from './cloudflare-stream.service';
import { VideosRepository } from './repositories/videos.repository';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';

@Module({
  controllers: [VideosController],
  providers: [CloudflareStreamService, VideosRepository, VideosService],
  exports: [VideosService],
})
export class VideosModule {}
