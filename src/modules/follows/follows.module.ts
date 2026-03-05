import { Module } from '@nestjs/common';
import { FollowsController } from './follows.controller';
import { FollowsService } from './follows.service';
import { FollowsRepository } from './repositories/follows.repository';
import { UsersRepository } from '../users/repositories/users.repository';

@Module({
  controllers: [FollowsController],
  providers: [FollowsService, FollowsRepository, UsersRepository],
})
export class FollowsModule {}

