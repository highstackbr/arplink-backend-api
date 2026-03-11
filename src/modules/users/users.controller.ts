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
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { createUserSchema, type CreateUserDto } from './dto/create-user.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { z } from 'zod';
import { FileInterceptor } from '@nestjs/platform-express';

const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  bio: z.string().optional(),
  avatar_url: z.string().optional(),
  banner_url: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  youtube: z.string().optional(),
  phone: z.string().optional(),
});

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async list(@Query('limit') limit?: string) {
    const n = limit ? Number(limit) : 50;
    return this.usersService.list(Number.isFinite(n) ? Math.max(1, Math.min(200, n)) : 50);
  }

  @Get('me')
  async me(@Req() req: Request) {
    const userId = (req.user as any)?.userId as string | undefined;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');
    const role = (req.user as any)?.role as string | undefined;
    const email = (req.user as any)?.email as string | undefined;
    return this.usersService.getOrCreateMe({ userId, role: role ?? null, email });
  }

  @Patch('me')
  async updateMe(@Req() req: Request, @Body() body: unknown) {
    const userId = (req.user as any)?.userId as string | undefined;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');
    const patch = updateMeSchema.parse(body);
    return this.usersService.updateMe(userId, patch);
  }

  @Post('me/banner')
  @UseInterceptors(FileInterceptor('banner'))
  async uploadBanner(@Req() req: Request & { file?: Express.Multer.File }) {
    const userId = (req.user as any)?.userId as string | undefined;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');
    const file = req.file;
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    const banner_url = await this.usersService.uploadBanner(userId, file);
    return { banner_url };
  }

  @Get('admin')
  @Roles('admin')
  async adminArea() {
    return { ok: true, scope: 'admin' };
  }

  @Get('search')
  async search(@Query('q') q?: string, @Query('limit') limit?: string) {
    const query = (q ?? '').trim();
    if (!query) throw new BadRequestException('Query vazia');
    const n = limit ? Number(limit) : 5;
    const lim = Number.isFinite(n) ? Math.max(1, Math.min(50, n)) : 5;
    return this.usersService.searchProfiles(query, lim);
  }

  @Get('suggestions')
  async suggestions(
    @Query('exclude') exclude?: string | string[],
    @Query('limit') limit?: string,
    @Req() req?: Request,
  ) {
    const currentUserId = (req?.user as any)?.userId as string | undefined;
    const list = Array.isArray(exclude) ? exclude : exclude ? [exclude] : [];
    const n = limit ? Number(limit) : 5;
    const lim = Number.isFinite(n) ? Math.max(1, Math.min(50, n)) : 5;
    const excludeIds = currentUserId ? [currentUserId, ...list] : list;
    return this.usersService.getSuggestions(excludeIds, lim);
  }

  @Get(':userId')
  async getById(@Param('userId') userId: string) {
    const profile = await this.usersService.getProfile(userId);
    if (!profile) throw new BadRequestException('Usuário não encontrado');
    return profile;
  }

  @Post()
  async create(@Body() body: unknown) {
    const input: CreateUserDto = createUserSchema.parse(body);
    throw new BadRequestException('Use /users/me com token para inicializar/atualizar o perfil');
  }
}

