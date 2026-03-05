import { Controller, Delete, Param, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { CommentLikesService } from './comment-likes.service';

@Controller('comments')
export class CommentLikesController {
  constructor(private readonly commentLikesService: CommentLikesService) {}

  @Post(':commentId/likes')
  async like(@Req() req: Request, @Param('commentId') commentId: string) {
    const userId = (req.user as any)?.userId as string | undefined;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');
    return this.commentLikesService.like(commentId, userId);
  }

  @Delete(':commentId/likes')
  async unlike(@Req() req: Request, @Param('commentId') commentId: string) {
    const userId = (req.user as any)?.userId as string | undefined;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');
    return this.commentLikesService.unlike(commentId, userId);
  }
}

