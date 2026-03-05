import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(@Req() req: Request & { file?: Express.Multer.File }) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');

    const file = req.file;
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');

    const url = await this.uploadService.uploadFile(userId, file);
    return { url };
  }
}
