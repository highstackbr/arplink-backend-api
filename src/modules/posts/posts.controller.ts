import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { createPostSchema, type CreatePostDto } from './dto/create-post.dto';
import { PostsService } from './posts.service';
import { ZodError } from 'zod';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async list(
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('userId') userId?: string,
  ) {
    const viewerId = (req.user as any)?.userId as string | undefined;
    if (!viewerId) throw new UnauthorizedException('Token ausente ou inválido');
    const lim = limit ? Number(limit) : 20;
    const off = offset ? Number(offset) : 0;
    const safeLimit = Number.isFinite(lim) ? Math.max(1, Math.min(50, lim)) : 20;
    const safeOffset = Number.isFinite(off) ? Math.max(0, off) : 0;
    const authorId = userId ? String(userId) : null;
    return this.postsService.listFeed({ viewerId, limit: safeLimit, offset: safeOffset, authorId });
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'main', maxCount: 1 },
      { name: 'extras', maxCount: 2 },
    ]),
  )
  async create(
    @Req() req: Request & {
      files?: {
        main?: Express.Multer.File[];
        extras?: Express.Multer.File[];
      };
    },
    @Body() body: unknown,
  ) {
    let input: CreatePostDto;
    try {
      input = createPostSchema.parse(body);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException('Payload inválido');
      }
      throw err;
    }
    const userId = req.user?.userId;
    if (!userId) {
      // Deve ser bloqueado antes pelo guard, mas mantemos por segurança.
      throw new UnauthorizedException('Token ausente ou inválido');
    }

    const main = req.files?.main?.[0];
    const extras = req.files?.extras ?? [];

    return this.postsService.createPost({
      userId,
      input,
      main,
      extras,
    });
  }

  @Delete(':postId')
  async delete(@Req() req: Request, @Param('postId') postId: string) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Token ausente ou inválido');
    }
    await this.postsService.deletePost({ postId, userId });
    return { ok: true };
  }
}

