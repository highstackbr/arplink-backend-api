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
}
