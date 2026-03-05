import { z } from 'zod';

export const createCertificateSchema = z.object({
  user_id: z.string().uuid(),
  title: z.string().min(1),
  issuer: z.string().min(1),
  issue_date: z.string().optional(),
  validation_code: z.string().optional(),
  validation_url: z.string().optional(),
});

export type CreateCertificateDto = z.infer<typeof createCertificateSchema>;

