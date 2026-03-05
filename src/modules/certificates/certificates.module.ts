import { Module } from '@nestjs/common';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';
import { CertificatesRepository } from './repositories/certificates.repository';
import { UsersRepository } from '../users/repositories/users.repository';

@Module({
  controllers: [CertificatesController],
  providers: [CertificatesService, CertificatesRepository, UsersRepository],
})
export class CertificatesModule {}

