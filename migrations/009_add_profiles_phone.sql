-- Adiciona coluna phone em profiles para configurações do perfil
ALTER TABLE IF EXISTS profiles
  ADD COLUMN IF NOT EXISTS phone text;
