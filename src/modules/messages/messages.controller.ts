import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ZodError } from 'zod';
import { MessagesService } from './messages.service';
import { sendMessageSchema } from './dto/send-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  async getHistory(
    @Req() req: Request,
    @Query('with') withUserId: string,
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');
    if (!withUserId) throw new BadRequestException('Parâmetro "with" é obrigatório');

    return this.messagesService.getHistory(userId, withUserId);
  }

  @Get('unread-counts')
  async getUnreadCounts(@Req() req: Request) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');
    return this.messagesService.getUnreadCounts(userId);
  }

  @Post('read')
  async markAsRead(@Req() req: Request, @Query('with') withUserId: string) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');
    if (!withUserId) throw new BadRequestException('Parâmetro "with" é obrigatório');
    await this.messagesService.markConversationAsRead(userId, withUserId);
    return { ok: true };
  }

  @Post()
  async send(@Req() req: Request, @Body() body: unknown) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');

    let dto;
    try {
      dto = sendMessageSchema.parse(body);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException('Payload inválido');
      }
      throw err;
    }

    return this.messagesService.send(userId, dto);
  }

  @Delete(':messageId')
  async delete(@Req() req: Request, @Param('messageId') messageId: string) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException('Token ausente ou inválido');

    await this.messagesService.delete(messageId, userId);
    return { ok: true };
  }
}
