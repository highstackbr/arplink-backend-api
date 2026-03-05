import { z } from 'zod';

export const updatePortfolioSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
});

export type UpdatePortfolioDto = z.infer<typeof updatePortfolioSchema>;

