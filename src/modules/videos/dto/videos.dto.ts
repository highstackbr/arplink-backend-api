import { z } from 'zod';

export const requestUploadUrlSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  maxDurationSeconds: z
    .number()
    .int()
    .min(1)
    .max(21600)
    .optional()
    .default(3600),
});

export type RequestUploadUrlDto = z.infer<typeof requestUploadUrlSchema>;

export const copyVideoSchema = z.object({
  url: z.string().url(),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
});

export type CopyVideoDto = z.infer<typeof copyVideoSchema>;

export const updateVideoMetadataSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
});

export type UpdateVideoMetadataDto = z.infer<typeof updateVideoMetadataSchema>;
