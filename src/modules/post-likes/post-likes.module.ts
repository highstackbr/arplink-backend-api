import { Module } from '@nestjs/common';
import { PostLikesController } from './post-likes.controller';
import { PostLikesService } from './post-likes.service';
import { PostLikesRepository } from './repositories/post-likes.repository';

@Module({
  controllers: [PostLikesController],
  providers: [PostLikesService, PostLikesRepository],
})
export class PostLikesModule {}

