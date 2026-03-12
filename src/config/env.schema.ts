import { z } from 'zod';

function optionalNonEmptyString() {
  return z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().min(1).optional(),
  );
}

export const envSchema = z.object({
  PORT: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 3000))
    .pipe(z.number().int().positive()),

  DATABASE_URL: z.string().min(1),
  PG_SSL_REJECT_UNAUTHORIZED: z
    .preprocess((v) => (typeof v === 'string' ? v.trim().toLowerCase() : v), z.string().optional())
    .transform((v) => (v === 'false' ? false : true)),

  SUPABASE_PROJECT_URL: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().url().optional(),
  ),
  SUPABASE_SERVICE_ROLE_KEY: optionalNonEmptyString(),
  SUPABASE_STORAGE_BUCKET: optionalNonEmptyString(),
  // Necessário quando o JWT do Supabase vem como HS256 (HMAC)
  SUPABASE_JWT_SECRET: optionalNonEmptyString(),
  SUPABASE_JWT_ISSUER: optionalNonEmptyString(),
  SUPABASE_JWT_AUDIENCE: optionalNonEmptyString(),

  CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
  CLOUDFLARE_STREAM_API_TOKEN: z.string().min(1),
  // Opcional quando não usamos Signed URLs / token assinado.
  CLOUDFLARE_STREAM_KEY_ID: optionalNonEmptyString(),
  CLOUDFLARE_STREAM_PRIVATE_KEY: optionalNonEmptyString(),
  CLOUDFLARE_CUSTOMER_SUBDOMAIN: optionalNonEmptyString(),

  // E-mail ARPLINK (SMTP) – cadastro e recuperação de senha
  SMTP_HOST: optionalNonEmptyString(),
  SMTP_PORT: z.preprocess((v) => (v !== undefined && v !== '' ? Number(v) : undefined), z.number().int().positive().optional()),
  SMTP_SECURE: z.preprocess(
    (v) => (v === undefined || v === '' ? undefined : (typeof v === 'string' ? v.trim().toLowerCase() === 'true' : Boolean(v))),
    z.boolean().optional(),
  ),
  SMTP_USER: optionalNonEmptyString(),
  SMTP_PASS: optionalNonEmptyString(),
  ARPLINK_EMAIL_FROM: optionalNonEmptyString(),
  FRONTEND_URL: optionalNonEmptyString(),
});

export type Env = z.infer<typeof envSchema>;

