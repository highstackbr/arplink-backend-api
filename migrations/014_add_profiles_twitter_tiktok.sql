-- Adiciona campos de redes sociais extras (Twitter/X e TikTok) ao perfil
ALTER TABLE IF EXISTS profiles
  ADD COLUMN IF NOT EXISTS twitter text,
  ADD COLUMN IF NOT EXISTS tiktok text;

