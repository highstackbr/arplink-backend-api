import { Module } from '@nestjs/common';
import { CommentLikesController } from './comment-likes.controller';
import { CommentLikesService } from './comment-likes.service';
import { CommentLikesRepository } from './repositories/comment-likes.repository';

@Module({
  controllers: [CommentLikesController],
  providers: [CommentLikesService, CommentLikesRepository],
})
export class CommentLikesModule {}

