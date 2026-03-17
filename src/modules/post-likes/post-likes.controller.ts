import { Controller, Delete, Get, Param, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { PostLikesService } from './post-likes.service';

@Controller('posts')
export class PostLikesController {
  constructor(private readonly postLikesService: PostLikesService) {}

  @Post(':postId/likes')
  async like(@Req() req: Request, @Param('postId') postId: string) {
    const userId = (req.user as any)?.userId as string | undefined;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');
    return this.postLikesService.like(postId, userId);
  }

  @Delete(':postId/likes')
  async unlike(@Req() req: Request, @Param('postId') postId: string) {
    const userId = (req.user as any)?.userId as string | undefined;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');
    return this.postLikesService.unlike(postId, userId);
  }

  @Get(':postId/likes')
  async list(@Req() req: Request, @Param('postId') postId: string) {
    const userId = (req.user as any)?.userId as string | undefined;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');
    return this.postLikesService.list(postId);
  }
}

