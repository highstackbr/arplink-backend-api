import { z } from 'zod';

export const createShareSchema = z.object({
  resource_id: z.string().uuid('resource_id deve ser um UUID válido'),
  resource_type: z.enum(['post', 'portfolio', 'lesson']).default('post'),
  target_user_id: z.string().uuid('target_user_id deve ser um UUID válido').optional(),
});

export type CreateShareDto = z.infer<typeof createShareSchema>;

