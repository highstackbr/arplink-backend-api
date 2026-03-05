import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { FollowsService } from './follows.service';

@Controller('users')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post(':targetUserId/follow')
  async follow(@Req() req: Request, @Param('targetUserId') targetUserId: string) {
    const followerId = (req.user as any)?.userId as string | undefined;
    if (!followerId) throw new UnauthorizedException('Token ausente ou inválido');
    if (followerId === targetUserId) throw new BadRequestException('Não é possível seguir a si mesmo');
    return this.followsService.follow(followerId, targetUserId);
  }

  @Delete(':targetUserId/follow')
  async unfollow(@Req() req: Request, @Param('targetUserId') targetUserId: string) {
    const followerId = (req.user as any)?.userId as string | undefined;
    if (!followerId) throw new UnauthorizedException('Token ausente ou inválido');
    return this.followsService.unfollow(followerId, targetUserId);
  }

  @Get(':userId/followers')
  async followers(@Param('userId') userId: string, @Query('limit') limit?: string) {
    const n = limit ? Number(limit) : 50;
    const lim = Number.isFinite(n) ? Math.max(1, Math.min(200, n)) : 50;
    return this.followsService.followers(userId, lim);
  }

  @Get(':userId/following')
  async following(@Param('userId') userId: string, @Query('limit') limit?: string) {
    const n = limit ? Number(limit) : 50;
    const lim = Number.isFinite(n) ? Math.max(1, Math.min(200, n)) : 50;
    return this.followsService.following(userId, lim);
  }

  @Get(':userId/follow-counts')
  async counts(@Param('userId') userId: string) {
    return this.followsService.counts(userId);
  }
}

