import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { CreatePostDto } from './dto/create-post.dto';
import { canPublishFromInputs } from './dto/create-post.dto';
import { MEDIA_STORAGE, type MediaStorage } from './media/media-storage';
import { PostsRepository } from './repositories/posts.repository';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function getExtFromMime(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  if (mime === 'video/mp4') return 'mp4';
  if (mime === 'video/webm') return 'webm';
  return 'bin';
}

function assertFileSize(file: Express.Multer.File, label: string) {
  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestException(`${label} excede 10MB`);
  }
}

@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepo: PostsRepository,
    @Inject(MEDIA_STORAGE) private readonly mediaStorage: MediaStorage,
  ) {}

  async listFeed(args: { viewerId: string; limit: number; offset: number; authorId?: string | null }) {
    const rows = await this.postsRepo.listFeed(args);
    return rows.map((r) => ({
      id: r.id,
      author: {
        id: r.author_id,
        name: r.author_name ?? 'Sem nome',
        username: r.author_username ?? '',
        role: (r.author_role as any) ?? 'student',
        avatar_url: r.author_avatar_url ?? '',
        banner_url: r.author_banner_url ?? '',
        bio: r.author_bio ?? '',
        followers: r.author_followers ?? 0,
        following: r.author_following ?? 0,
      },
      content: r.content,
      media_url: r.media_url ?? undefined,
      media_type: r.media_url ? (r.media_type === 'video' ? 'video' : 'image') : 'none',
      likes_count: r.likes_count ?? 0,
      comments_count: r.comments_count ?? 0,
      shares: 0,
      created_at: r.created_at,
      is_liked: Boolean(r.is_liked),
    }));
  }

  async createPost(args: {
    userId: string;
    input: CreatePostDto;
    main?: Express.Multer.File;
    extras?: Express.Multer.File[];
  }) {
    const content = args.input.content ?? '';
    const externalLink = (args.input.externalLink ?? '').trim();

    const main = args.main;
    const extras = (args.extras ?? []).filter(Boolean);

    if (extras.length > 2) {
      throw new BadRequestException('Máximo de 2 imagens adicionais');
    }

    if (main) {
      assertFileSize(main, 'Arquivo principal');
      if (!main.mimetype.startsWith('image/') && !main.mimetype.startsWith('video/')) {
        throw new BadRequestException('Arquivo principal deve ser imagem ou vídeo');
      }
    }

    for (const [idx, f] of extras.entries()) {
      assertFileSize(f, `Imagem adicional ${idx + 1}`);
      if (!f.mimetype.startsWith('image/')) {
        throw new BadRequestException('Imagens adicionais devem ser do tipo imagem');
      }
    }

    const canPublish = canPublishFromInputs({
      content,
      externalLink,
      hasMainMedia: Boolean(main),
      hasAnyExtraMedia: extras.length > 0,
    });

    if (!canPublish) {
      throw new BadRequestException('Conteúdo inválido para publicação');
    }

    const uploadedUrls: string[] = [];
    const now = Date.now();

    if (main) {
      const ext = getExtFromMime(main.mimetype);
      const path = `posts/${args.userId}/${now}_main.${ext}`;
      const { publicUrl } = await this.mediaStorage.upload({
        path,
        contentType: main.mimetype,
        data: main.buffer,
      });
      uploadedUrls.push(publicUrl);
    }

    if (externalLink) {
      uploadedUrls.push(externalLink);
    }

    for (let i = 0; i < extras.length; i++) {
      const f = extras[i]!;
      const ext = getExtFromMime(f.mimetype);
      const path = `posts/${args.userId}/${now}_extra_${i + 1}.${ext}`;
      const { publicUrl } = await this.mediaStorage.upload({
        path,
        contentType: f.mimetype,
        data: f.buffer,
      });
      uploadedUrls.push(publicUrl);
    }

    let finalContent = content;
    if (uploadedUrls.length > 1) {
      finalContent += `\n[CAROUSEL_DATA]${JSON.stringify(uploadedUrls)}[/CAROUSEL_DATA]`;
    }

    const isVideo = Boolean(externalLink) || (main?.mimetype.includes('video') ?? false);

    const post = await this.postsRepo.insertPost({
      userId: args.userId,
      content: finalContent,
      mediaUrl: uploadedUrls[0] ?? null,
      mediaType: isVideo ? 'video' : 'image',
    });

    return {
      id: post.id,
      userId: post.user_id,
      content: post.content,
      mediaUrl: post.media_url,
      mediaType: post.media_type === 'video' ? 'video' : 'image',
      mediaUrls: uploadedUrls,
      createdAt: post.created_at,
    };
  }

  /** Retorna conteúdo e mídia do post para preview (ex.: compartilhamento no chat). */
  async getPreviewById(postId: string): Promise<{ content: string; media_url: string | null; media_type: 'image' | 'video' } | null> {
    const row = await this.postsRepo.findById(postId);
    if (!row) return null;
    const mediaType = row.media_type === 'video' ? 'video' : 'image';
    return { content: row.content, media_url: row.media_url, media_type: mediaType };
  }

  async deletePost(args: { postId: string; userId: string }) {
    const deleted = await this.postsRepo.deletePostByOwner(args);
    if (!deleted) {
      throw new BadRequestException('Post não encontrado ou não pertence ao usuário');
    }
  }
}

