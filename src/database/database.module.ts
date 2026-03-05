import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PG_POOL, createPgPool } from './postgres.pool';

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        if (!databaseUrl) {
          throw new Error('DATABASE_URL não configurado');
        }
        const sslRejectUnauthorized =
          (config.get('PG_SSL_REJECT_UNAUTHORIZED') as boolean | undefined) ?? true;
        return createPgPool(databaseUrl, { sslRejectUnauthorized });
      },
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}

