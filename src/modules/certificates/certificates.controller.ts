import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ZodError } from 'zod';
import { CertificatesService } from './certificates.service';
import { createCertificateSchema, type CreateCertificateDto } from './dto/create-certificate.dto';

@Controller()
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get('users/:userId/certificates')
  async list(@Param('userId') userId: string) {
    return this.certificatesService.listByUser(userId);
  }

  @Post('certificates')
  async create(@Req() req: Request, @Body() body: unknown) {
    const userId = (req.user as any)?.userId as string | undefined;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');
    try {
      const dto: CreateCertificateDto = createCertificateSchema.parse(body);
      return this.certificatesService.create(userId, dto);
    } catch (err) {
      if (err instanceof ZodError) throw new BadRequestException('Payload inválido');
      throw err;
    }
  }

  @Delete('certificates/:id')
  async delete(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any)?.userId as string | undefined;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');
    return this.certificatesService.delete(userId, id);
  }
}

