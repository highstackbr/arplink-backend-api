import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ZodError } from 'zod';
import { SharesService } from './shares.service';
import { createShareSchema } from './dto/create-share.dto';

@Controller('shares')
export class SharesController {
  constructor(private readonly sharesService: SharesService) {}

  @Post()
  async create(@Req() req: Request, @Body() body: unknown) {
    const userId = (req.user as any)?.userId as string | undefined;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');

    try {
      const dto = createShareSchema.parse(body);
      return this.sharesService.create(userId, dto);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException('Payload inválido');
      }
      throw err;
    }
  }

  @Get()
  async list(
    @Req() req: Request,
    @Query('resourceId') resourceId: string,
    @Query('resourceType') resourceType = 'post',
  ) {
    const userId = (req.user as any)?.userId as string | undefined;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');
    if (!resourceId) throw new BadRequestException('resourceId é obrigatório');

    return this.sharesService.list(resourceId, resourceType);
  }

  /** Compartilhamentos recebidos pelo usuário logado (apenas não visitados) */
  @Get('received')
  async listReceived(@Req() req: Request, @Query('limit') limit?: string) {
    const userId = (req.user as any)?.userId as string | undefined;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');

    const lim = limit ? Math.min(100, Math.max(1, Number(limit))) : 50;
    return this.sharesService.listReceived(userId, Number.isFinite(lim) ? lim : 50);
  }

  /** Marca compartilhamento como visitado (sai da lista "Compartilhados comigo") */
  @Post(':id/view')
  async markViewed(@Req() req: Request, @Param('id') shareId: string) {
    const userId = (req.user as any)?.userId as string | undefined;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');
    const ok = await this.sharesService.markViewed(shareId, userId);
    if (!ok) throw new BadRequestException('Compartilhamento não encontrado ou já visitado');
    return { ok: true };
  }
}

