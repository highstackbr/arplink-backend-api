import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ZodError } from 'zod';
import { PortfolioService } from './portfolio.service';
import { updatePortfolioSchema } from './dto/update-portfolio.dto';

@Controller()
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('users/:userId/portfolio')
  async list(@Param('userId') userId: string) {
    return this.portfolioService.listByUser(userId);
  }

  @Post('portfolio')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'files', maxCount: 4 },
      { name: 'file', maxCount: 1 },
      { name: 'media', maxCount: 4 },
    ]),
  )
  async create(
    @Req()
    req: Request & {
      files?: {
        files?: Express.Multer.File[];
        file?: Express.Multer.File[];
        media?: Express.Multer.File[];
      };
    },
    @Body() body: any,
  ) {
    const userId = (req.user as any)?.userId as string | undefined;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');
    const title = typeof body?.title === 'string' ? body.title : '';
    const description = typeof body?.description === 'string' ? body.description : '';
    const files = [
      ...(req.files?.files ?? []),
      ...(req.files?.media ?? []),
      ...(req.files?.file ?? []),
    ].filter(Boolean);
    return this.portfolioService.create({ userId, title, description, files });
  }

  @Patch('portfolio/:id')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: unknown) {
    const userId = (req.user as any)?.userId as string | undefined;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');
    try {
      const patch = updatePortfolioSchema.parse(body);
      return this.portfolioService.update({ id, userId, patch });
    } catch (err) {
      if (err instanceof ZodError) throw new BadRequestException('Payload inválido');
      throw err;
    }
  }

  @Delete('portfolio/:id')
  async delete(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any)?.userId as string | undefined;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');
    return this.portfolioService.delete({ id, userId });
  }
}

