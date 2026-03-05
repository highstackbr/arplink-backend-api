import { z } from 'zod';

export const sendMessageSchema = z.object({
  receiver_id: z.string().uuid('receiver_id deve ser um UUID válido'),
  text: z.string().max(5000).default(''),
  voice_url: z.string().url().optional(),
  attachment_url: z.string().url().optional(),
});

export type SendMessageDto = z.infer<typeof sendMessageSchema>;
