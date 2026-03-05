import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { CommentsService, addCommentSchema } from './comments.service';
import { ZodError } from 'zod';

@Controller('posts')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get(':postId/comments')
  async list(@Req() req: Request, @Param('postId') postId: string) {
    const viewerId = (req.user as any)?.userId as string | undefined;
    if (!viewerId) throw new UnauthorizedException('Token ausente ou inválido');
    return this.commentsService.list(postId, viewerId);
  }

  @Post(':postId/comments')
  async add(@Req() req: Request, @Param('postId') postId: string, @Body() body: unknown) {
    const userId = (req.user as any)?.userId as string | undefined;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');
    try {
      const dto = addCommentSchema.parse(body);
      return this.commentsService.add(postId, userId, dto);
    } catch (err) {
      if (err instanceof ZodError) throw new BadRequestException('Payload inválido');
      throw err;
    }
  }
}

