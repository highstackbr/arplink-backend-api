import { BadRequestException, Injectable } from '@nestjs/common';
import { MessagesRepository } from './repositories/messages.repository';
import type { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly messagesRepo: MessagesRepository) {}

  async getHistory(currentUserId: string, withUserId: string) {
    if (!withUserId) {
      throw new BadRequestException('Parâmetro "with" é obrigatório');
    }
    return this.messagesRepo.findBetweenUsers(currentUserId, withUserId);
  }

  async send(senderId: string, dto: SendMessageDto) {
    if (senderId === dto.receiver_id) {
      throw new BadRequestException('Não é possível enviar mensagem para si mesmo');
    }
    return this.messagesRepo.insert({
      senderId,
      receiverId: dto.receiver_id,
      text: dto.text,
      voiceUrl: dto.voice_url,
      attachmentUrl: dto.attachment_url,
    });
  }

  /** Cria uma mensagem de compartilhamento no chat (link + miniatura). */
  async sendShareMessage(
    senderId: string,
    receiverId: string,
    payload: {
      resource_type: string;
      resource_id: string;
      title?: string;
      thumbnail_url?: string;
      media_type?: 'image' | 'video';
    },
  ) {
    const title = payload.title ?? 'Publicação compartilhada';
    return this.messagesRepo.insert({
      senderId,
      receiverId,
      text: 'Compartilhou uma publicação',
      attachmentUrl: payload.thumbnail_url ?? undefined,
      metadata: {
        type: 'share',
        resource_type: payload.resource_type,
        resource_id: payload.resource_id,
        title,
        ...(payload.media_type && { media_type: payload.media_type }),
      },
    });
  }

  async delete(messageId: string, requesterId: string) {
    const deleted = await this.messagesRepo.deleteForUser(messageId, requesterId);
    if (!deleted) {
      throw new BadRequestException('Mensagem não encontrada ou não pertence ao usuário');
    }
  }

  /** Retorna contagem de não lidas por conversa (sender_id -> count). */
  async getUnreadCounts(currentUserId: string): Promise<Record<string, number>> {
    const rows = await this.messagesRepo.countUnreadBySenders(currentUserId);
    const out: Record<string, number> = {};
    for (const r of rows) {
      out[r.sender_id] = parseInt(r.count, 10) || 0;
    }
    return out;
  }

  /** Marca como lidas as mensagens recebidas de um usuário. */
  async markConversationAsRead(currentUserId: string, fromUserId: string): Promise<void> {
    await this.messagesRepo.markAsRead(currentUserId, fromUserId);
  }
}
