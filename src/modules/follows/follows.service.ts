import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../users/repositories/users.repository';
import { FollowsRepository } from './repositories/follows.repository';

@Injectable()
export class FollowsService {
  constructor(
    private readonly followsRepo: FollowsRepository,
    private readonly usersRepo: UsersRepository,
  ) {}

  private toUser(row: any) {
    return {
      id: row.id,
      name: row.name ?? '',
      username: row.username ?? '',
      role: (row.role ?? 'student') as any,
      avatar_url: row.avatar_url ?? '',
      banner_url: row.banner_url ?? '',
      bio: row.bio ?? '',
      followers: row.followers ?? 0,
      following: row.following ?? 0,
      facebook: row.facebook ?? undefined,
      instagram: row.instagram ?? undefined,
      linkedin: row.linkedin ?? undefined,
      youtube: row.youtube ?? undefined,
    };
  }

  async follow(followerId: string, targetId: string) {
    await this.usersRepo.upsertProfileBase({ id: followerId });
    await this.usersRepo.upsertProfileBase({ id: targetId });
    await this.followsRepo.follow(followerId, targetId);
    return { ok: true };
  }

  async unfollow(followerId: string, targetId: string) {
    await this.followsRepo.unfollow(followerId, targetId);
    return { ok: true };
  }

  async followers(userId: string, limit = 50) {
    const ids = await this.followsRepo.getFollowers(userId, limit);
    const rows = await Promise.all(ids.map((id) => this.usersRepo.findById(id)));
    return rows.filter(Boolean).map((r) => this.toUser(r));
  }

  async following(userId: string, limit = 50) {
    const ids = await this.followsRepo.getFollowing(userId, limit);
    const rows = await Promise.all(ids.map((id) => this.usersRepo.findById(id)));
    return rows.filter(Boolean).map((r) => this.toUser(r));
  }

  async counts(userId: string) {
    return this.followsRepo.getCounts(userId);
  }
}

