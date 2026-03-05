-- Migration: 007_create_videos
-- Tabela para armazenar metadados de vídeos hospedados no Cloudflare Stream.
-- O arquivo binário nunca passa pelo backend — é enviado diretamente do cliente
-- para o Cloudflare via URL de upload assinada (direct upload).

CREATE TABLE IF NOT EXISTS videos (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL,
  cloudflare_uid  TEXT        NOT NULL UNIQUE,
  title           TEXT,
  description     TEXT,
  duration        NUMERIC,                          -- duração em segundos (preenchida após processamento)
  status          TEXT        NOT NULL DEFAULT 'queued'
                  CHECK (status IN ('queued', 'inprogress', 'ready', 'error')),
  thumbnail_url   TEXT,                             -- URL da thumbnail gerada pelo Cloudflare
  size_bytes      BIGINT,                           -- tamanho do arquivo original em bytes
  require_signed  BOOLEAN     NOT NULL DEFAULT true, -- se true, exige signed token para playback
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_videos_user_id    ON videos (user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status     ON videos (status);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos (created_at DESC);
