import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentsRepository } from './repositories/comments.repository';
import { UsersRepository } from '../users/repositories/users.repository';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, CommentsRepository, UsersRepository],
})
export class CommentsModule {}

