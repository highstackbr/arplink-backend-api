import { Injectable } from '@nestjs/common';
import { CommentLikesRepository } from './repositories/comment-likes.repository';

@Injectable()
export class CommentLikesService {
  constructor(private readonly repo: CommentLikesRepository) {}

  async like(commentId: string, userId: string) {
    await this.repo.like(commentId, userId);
    return { ok: true };
  }

  async unlike(commentId: string, userId: string) {
    await this.repo.unlike(commentId, userId);
    return { ok: true };
  }
}

