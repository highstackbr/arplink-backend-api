import { z } from 'zod';

const MAX_CHARS = 2200;

const YOUTUBE_REGEX =
  /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
const TIKTOK_REGEX =
  /(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com\/@[\w.-]+\/video\/(\d+)|(?:vm|vt)\.tiktok\.com\/([\w-]+))/i;
const URL_VALIDATOR_REGEX =
  /^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(\:\d+)?(\/[-a-z\d%_.~+@]*)*(\?[;&a-z\d%_.~+@=-]*)?(\#[-a-z\d_]*)?$/i;

export const createPostSchema = z.object({
  content: z
    .string()
    .optional()
    .transform((v) => v ?? ''),
  externalLink: z
    .string()
    .optional()
    .transform((v) => (v ?? '').trim())
    .refine((v) => v.length === 0 || URL_VALIDATOR_REGEX.test(v), 'Link inválido'),
});

export type CreatePostDto = z.infer<typeof createPostSchema>;

export function detectPlatformFromExternalLink(
  externalLink: string,
): 'youtube' | 'tiktok' | 'link' | null {
  const link = externalLink.trim();
  if (!link) return null;
  if (!URL_VALIDATOR_REGEX.test(link)) return null;
  if (YOUTUBE_REGEX.test(link)) return 'youtube';
  if (TIKTOK_REGEX.test(link)) return 'tiktok';
  return 'link';
}

export function canPublishFromInputs(args: {
  content: string;
  externalLink: string;
  hasMainMedia: boolean;
  hasAnyExtraMedia: boolean;
}): boolean {
  const content = args.content ?? '';
  if (content.length > MAX_CHARS) return false;

  const externalLink = (args.externalLink ?? '').trim();
  const hasLink = externalLink.length > 0;
  const platform = hasLink ? detectPlatformFromExternalLink(externalLink) : null;
  const isLinkValid = !hasLink || platform !== null;

  if (hasLink) {
    return isLinkValid && (args.hasMainMedia || platform !== 'link');
  }

  return content.trim().length > 0 || args.hasMainMedia || args.hasAnyExtraMedia;
}

