import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersRepository } from '../users/repositories/users.repository';
import type { CreateCertificateDto } from './dto/create-certificate.dto';
import { CertificatesRepository } from './repositories/certificates.repository';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly repo: CertificatesRepository,
    private readonly usersRepo: UsersRepository,
  ) {}

  async listByUser(userId: string) {
    return this.repo.listByUser(userId);
  }

  async create(currentUserId: string, dto: CreateCertificateDto) {
    if (dto.user_id !== currentUserId) {
      throw new BadRequestException('user_id inválido');
    }
    await this.usersRepo.upsertProfileBase({ id: currentUserId });
    return this.repo.insert({
      user_id: dto.user_id,
      title: dto.title,
      issuer: dto.issuer,
      issue_date: dto.issue_date ?? null,
      validation_code: dto.validation_code ?? null,
      validation_url: dto.validation_url ?? null,
    });
  }

  async delete(currentUserId: string, id: string) {
    const ok = await this.repo.deleteById(id, currentUserId);
    return { ok };
  }
}

