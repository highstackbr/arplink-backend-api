import { Injectable } from '@nestjs/common';
import { SharesRepository } from './repositories/shares.repository';
import { MessagesService } from '../messages/messages.service';
import { PostsService } from '../posts/posts.service';
import type { CreateShareDto } from './dto/create-share.dto';

@Injectable()
export class SharesService {
  constructor(
    private readonly sharesRepo: SharesRepository,
    private readonly messagesService: MessagesService,
    private readonly postsService: PostsService,
  ) {}

  async create(ownerId: string, dto: CreateShareDto) {
    const row = await this.sharesRepo.insert({
      ownerId,
      resourceId: dto.resource_id,
      resourceType: dto.resource_type,
      targetUserId: dto.target_user_id ?? null,
    });

    if (row.target_user_id) {
      let title: string | undefined;
      let thumbnailUrl: string | undefined;
      let mediaType: 'image' | 'video' | undefined;
      if (dto.resource_type === 'post') {
        const preview = await this.postsService.getPreviewById(dto.resource_id);
        if (preview) {
          title = preview.content.slice(0, 120).trim() || 'Publicação compartilhada';
          mediaType = preview.media_type;
          // Só usar URL como miniatura quando for imagem; vídeo não pode ser exibido em <img>
          if (preview.media_type === 'image' && preview.media_url) {
            thumbnailUrl = preview.media_url;
          }
        }
      }
      await this.messagesService.sendShareMessage(ownerId, row.target_user_id, {
        resource_type: dto.resource_type,
        resource_id: dto.resource_id,
        title,
        thumbnail_url: thumbnailUrl,
        media_type: mediaType,
      });
    }

    return {
      id: row.id,
      owner_id: row.owner_id,
      resource_id: row.resource_id,
      resource_type: row.resource_type,
      target_user_id: row.target_user_id,
      created_at: row.created_at,
    };
  }

  async list(resourceId: string, resourceType: string) {
    const rows = await this.sharesRepo.listByResource({ resourceId, resourceType });
    return rows.map((r) => ({
      id: r.id,
      owner: {
        id: r.owner_id,
        name: r.owner_name,
        username: r.owner_username,
        avatar_url: r.owner_avatar_url,
      },
      target_user_id: r.target_user_id,
      created_at: r.created_at,
    }));
  }

  /** Lista compartilhamentos recebidos pelo usuário (apenas não visitados; com título/miniatura) */
  async listReceived(targetUserId: string, limit = 50) {
    const rows = await this.sharesRepo.listReceivedByUser(targetUserId, limit);
    const items = await Promise.all(
      rows.map(async (r) => {
        let title: string | undefined;
        let thumbnail_url: string | undefined;
        let media_type: 'image' | 'video' | undefined;
        if (r.resource_type === 'post') {
          const preview = await this.postsService.getPreviewById(r.resource_id);
          if (preview) {
            title = preview.content.slice(0, 80).trim() || 'Publicação compartilhada';
            media_type = preview.media_type;
            if (preview.media_type === 'image' && preview.media_url) thumbnail_url = preview.media_url;
          }
        }
        return {
          id: r.id,
          owner: {
            id: r.owner_id,
            name: r.owner_name,
            username: r.owner_username,
            avatar_url: r.owner_avatar_url,
          },
          resource_id: r.resource_id,
          resource_type: r.resource_type,
          created_at: r.created_at,
          title,
          thumbnail_url,
          media_type,
        };
      }),
    );
    return items;
  }

  /** Marca um compartilhamento como visitado (sai da lista "Compartilhados comigo") */
  async markViewed(shareId: string, targetUserId: string): Promise<boolean> {
    return this.sharesRepo.markViewed(shareId, targetUserId);
  }
}

