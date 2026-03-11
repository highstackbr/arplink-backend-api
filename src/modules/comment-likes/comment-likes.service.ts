import { Injectable, NotFoundException } from '@nestjs/common';
import { CommentLikesRepository } from './repositories/comment-likes.repository';

@Injectable()
export class CommentLikesService {
  constructor(private readonly repo: CommentLikesRepository) {}

  async like(commentId: string, userId: string) {
    const exists = await this.repo.commentExists(commentId);
    if (!exists) throw new NotFoundException('Comentário não encontrado');
    await this.repo.like(commentId, userId);
    return { ok: true };
  }

  async unlike(commentId: string, userId: string) {
    await this.repo.unlike(commentId, userId);
    return { ok: true };
  }
}

