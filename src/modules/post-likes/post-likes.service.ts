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

  async list(postId: string) {
    const rows = await this.repo.listByPost(postId);
    return rows.map((r) => ({
      id: r.user_id,
      name: r.name,
      username: r.username,
      avatar_url: r.avatar_url,
    }));
  }
}

