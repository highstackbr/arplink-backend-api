import { Module } from '@nestjs/common';
import { SharesController } from './shares.controller';
import { SharesService } from './shares.service';
import { SharesRepository } from './repositories/shares.repository';
import { MessagesModule } from '../messages/messages.module';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [MessagesModule, PostsModule],
  controllers: [SharesController],
  providers: [SharesService, SharesRepository],
})
export class SharesModule {}

