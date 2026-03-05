import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ZodError } from 'zod';
import {
  copyVideoSchema,
  requestUploadUrlSchema,
  updateVideoMetadataSchema,
} from './dto/videos.dto';
import { VideosService } from './videos.service';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  /**
   * Gera uma URL de upload direto para o Cloudflare Stream e registra o vídeo no banco.
   * O frontend deve usar essa URL para enviar o arquivo diretamente ao Cloudflare.
   */
  @Post('upload-url')
  async requestUploadUrl(@Req() req: Request, @Body() body: unknown) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');

    let dto;
    try {
      dto = requestUploadUrlSchema.parse(body ?? {});
    } catch (err) {
      if (err instanceof ZodError) throw new BadRequestException('Payload inválido');
      throw err;
    }

    return this.videosService.requestUploadUrl(userId, dto);
  }

  /**
   * Importa um vídeo a partir de uma URL pública (Stream Copy).
   * Útil para simplificar o fluxo: o frontend faz upload para um storage público (ex.: Supabase),
   * depois chama este endpoint informando a URL.
   */
  @Post('copy')
  async copyFromUrl(@Req() req: Request, @Body() body: unknown) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');

    try {
      const dto = copyVideoSchema.parse(body ?? {});
      return this.videosService.copyFromUrl(userId, dto);
    } catch (err) {
      if (err instanceof ZodError) throw new BadRequestException('Payload inválido');
      throw err;
    }
  }

  /**
   * Atualiza título e descrição de um vídeo após o upload.
   */
  @Patch(':id/metadata')
  async updateMetadata(
    @Req() req: Request,
    @Param('id') videoId: string,
    @Body() body: unknown,
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');

    let dto;
    try {
      dto = updateVideoMetadataSchema.parse(body ?? {});
    } catch (err) {
      if (err instanceof ZodError) throw new BadRequestException('Payload inválido');
      throw err;
    }

    return this.videosService.updateMetadata(userId, videoId, dto);
  }

  /**
   * Retorna um vídeo para reprodução pública (sem signed token).
   */
  @Get(':id')
  async getVideo(@Req() req: Request, @Param('id') videoId: string) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');

    return this.videosService.getVideo(userId, videoId);
  }

  /**
   * Lista os vídeos do usuário autenticado com paginação.
   */
  @Get()
  async listVideos(
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');

    const parsedLimit = limit ? Math.min(parseInt(limit, 10) || 20, 100) : 20;
    const parsedOffset = offset ? parseInt(offset, 10) || 0 : 0;

    return this.videosService.listByUser(userId, parsedLimit, parsedOffset);
  }
}
