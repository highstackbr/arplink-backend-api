import { envSchema, type Env } from './env.schema';

export function loadEnv(rawEnv: NodeJS.ProcessEnv): Env {
  const parsed = envSchema.safeParse(rawEnv);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join(', ');
    throw new Error(`Variáveis de ambiente inválidas: ${issues}`);
  }
  return parsed.data;
}

