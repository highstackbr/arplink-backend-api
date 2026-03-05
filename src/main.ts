import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseMetadataInterceptor } from './common/interceptors/response-metadata.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : ['http://localhost:3001'];

  // Permite origens explícitas + qualquer subdomínio .vercel.app (produção)
  const allowedOriginPatterns: (string | RegExp)[] = [
    ...corsOrigins,
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  ];

  app.enableCors({
    origin: allowedOriginPatterns,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Accept-Language'],
    credentials: true,
    optionsSuccessStatus: 204,
    preflightContinue: false,
  });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseMetadataInterceptor());

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`API listening on http://localhost:${port}/api`);
}

bootstrap();

