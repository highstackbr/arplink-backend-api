import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { loadEnv } from './config/env';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './modules/email/email.module';
import { AuthRequiredGuard } from './auth/guards/auth-required.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { PostsModule } from './modules/posts/posts.module';
import { UsersModule } from './modules/users/users.module';
import { MessagesModule } from './modules/messages/messages.module';
import { UploadModule } from './modules/upload/upload.module';
import { VideosModule } from './modules/videos/videos.module';
import { FollowsModule } from './modules/follows/follows.module';
import { PostLikesModule } from './modules/post-likes/post-likes.module';
import { CommentsModule } from './modules/comments/comments.module';
import { CommentLikesModule } from './modules/comment-likes/comment-likes.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { SharesModule } from './modules/shares/shares.module';
import { httpLoggerMiddleware } from './common/middleware/http-logger.middleware';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import { SupabaseJwtMiddleware } from './auth/middleware/supabase-jwt.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (rawEnv) => loadEnv(rawEnv),
    }),
    EmailModule,
    AuthModule,
    DatabaseModule,
    HealthModule,
    PostsModule,
    UsersModule,
    FollowsModule,
    PostLikesModule,
    CommentsModule,
    CommentLikesModule,
    CertificatesModule,
    PortfolioModule,
    MessagesModule,
    UploadModule,
    VideosModule,
    SharesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthRequiredGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(requestIdMiddleware, SupabaseJwtMiddleware, httpLoggerMiddleware).forRoutes('{*splat}');
  }
}

