import { BadRequestException, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { UsersRepository } from '../users/repositories/users.repository';
import { CommentsRepository } from './repositories/comments.repository';

export const addCommentSchema = z.object({
  text: z.string().min(1),
  parent_id: z.string().nullable().optional(),
});
export type AddCommentDto = z.infer<typeof addCommentSchema>;

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepo: CommentsRepository,
    private readonly usersRepo: UsersRepository,
  ) {}

  async list(postId: string, viewerId: string) {
    const rows = await this.commentsRepo.listByPost({ postId, viewerId });
    return rows.map((r) => ({
      id: r.id,
      post_id: r.post_id,
      user_id: r.user_id,
      parent_id: r.parent_id,
      text: r.text,
      likes_count: r.likes_count ?? 0,
      is_liked: Boolean(r.is_liked),
      created_at: r.created_at,
      author: {
        name: r.author_name ?? 'Sem nome',
        avatar_url: r.author_avatar_url ?? '',
      },
    }));
  }

  async add(postId: string, userId: string, dto: AddCommentDto) {
    if (!dto.text?.trim()) throw new BadRequestException('Texto vazio');
    await this.usersRepo.upsertProfileBase({ id: userId });
    const inserted = await this.commentsRepo.insert({
      postId,
      userId,
      text: dto.text.trim(),
      parentId: dto.parent_id ?? null,
    });
    const view = await this.commentsRepo.findViewById({ commentId: inserted.id, viewerId: userId });
    if (!view) throw new Error('Falha ao buscar comentário recém-criado');
    return {
      id: view.id,
      post_id: view.post_id,
      user_id: view.user_id,
      parent_id: view.parent_id,
      text: view.text,
      likes_count: view.likes_count ?? 0,
      is_liked: Boolean(view.is_liked),
      created_at: view.created_at,
      author: {
        name: view.author_name ?? 'Sem nome',
        avatar_url: view.author_avatar_url ?? '',
      },
    };
  }
}

