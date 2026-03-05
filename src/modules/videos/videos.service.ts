import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CloudflareStreamService } from './cloudflare-stream.service';
import { VideosRepository } from './repositories/videos.repository';
import type { CopyVideoDto, RequestUploadUrlDto, UpdateVideoMetadataDto } from './dto/videos.dto';

@Injectable()
export class VideosService {
  constructor(
    private readonly cfStream: CloudflareStreamService,
    private readonly videosRepo: VideosRepository,
  ) {}

  async requestUploadUrl(userId: string, dto: RequestUploadUrlDto) {
    const { uploadUrl, cloudflareUid } = await this.cfStream.createDirectUploadUrl({
      maxDurationSeconds: dto.maxDurationSeconds,
      meta: { userId, title: dto.title ?? '' },
    });

    const video = await this.videosRepo.insert({
      userId,
      cloudflareUid,
      title: dto.title,
      description: dto.description,
    });

    return {
      videoId: video.id,
      uploadUrl,
      cloudflareUid,
    };
  }

  async copyFromUrl(userId: string, dto: CopyVideoDto) {
    const { cloudflareUid } = await this.cfStream.copyFromUrl({
      url: dto.url,
      meta: { userId, title: dto.title ?? '' },
    });

    const video = await this.videosRepo.insert({
      userId,
      cloudflareUid,
      title: dto.title,
      description: dto.description,
      requireSigned: false,
    });

    return {
      videoId: video.id,
      cloudflareUid,
    };
  }

  async updateMetadata(userId: string, videoId: string, dto: UpdateVideoMetadataDto) {
    const existing = await this.videosRepo.findById(videoId);
    if (!existing) {
      throw new NotFoundException('Vídeo não encontrado');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenException('Acesso negado');
    }

    const updated = await this.videosRepo.updateMetadata({
      id: videoId,
      title: dto.title,
      description: dto.description,
    });

    return updated;
  }

  async getVideo(userId: string, videoId: string) {
    const video = await this.videosRepo.findById(videoId);
    if (!video) {
      throw new NotFoundException('Vídeo não encontrado');
    }
    if (video.user_id !== userId) {
      throw new ForbiddenException('Acesso negado');
    }

    const cfInfo = await this.cfStream.getVideoInfo(video.cloudflare_uid).catch(() => null);

    if (cfInfo && cfInfo.status.state !== video.status) {
      await this.videosRepo.updateStatus({
        cloudflareUid: video.cloudflare_uid,
        status: cfInfo.status.state,
        duration: cfInfo.duration,
        thumbnailUrl: cfInfo.thumbnail,
        sizeBytes: cfInfo.size,
      });
      video.status = cfInfo.status.state;
      video.duration = cfInfo.duration;
      video.thumbnail_url = cfInfo.thumbnail;
      video.size_bytes = cfInfo.size;
    }

    const signedToken: string | null = null;
    let playerUrl: string | null = null;

    if (video.status === 'ready') {
      playerUrl = this.cfStream.buildPlayerUrl(video.cloudflare_uid);
    }

    return {
      id: video.id,
      userId: video.user_id,
      title: video.title,
      description: video.description,
      duration: video.duration,
      status: video.status,
      thumbnailUrl:
        video.thumbnail_url ??
        (video.status === 'ready'
          ? this.cfStream.buildThumbnailUrl(video.cloudflare_uid)
          : null),
      sizeBytes: video.size_bytes,
      signedToken,
      playerUrl,
      createdAt: video.created_at,
      updatedAt: video.updated_at,
    };
  }

  async listByUser(userId: string, limit = 20, offset = 0) {
    const rows = await this.videosRepo.findByUserId(userId, limit, offset);

    return rows.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      duration: v.duration,
      status: v.status,
      thumbnailUrl: v.thumbnail_url,
      sizeBytes: v.size_bytes,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
    }));
  }
}
