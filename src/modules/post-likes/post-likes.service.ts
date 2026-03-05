import { Injectable } from '@nestjs/common';
import { PostLikesRepository } from './repositories/post-likes.repository';

@Injectable()
export class PostLikesService {
  constructor(private readonly repo: PostLikesRepository) {}

  async like(postId: string, userId: string) {
    await this.repo.like(postId, userId);
    return { ok: true };
  }

  async unlike(postId: string, userId: string) {
    await this.repo.unlike(postId, userId);
    return { ok: true };
  }
}

