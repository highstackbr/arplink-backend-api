-- Marca compartilhamentos já visitados pelo destinatário (sair da lista "Compartilhados comigo")
ALTER TABLE shares
  ADD COLUMN IF NOT EXISTS viewed_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_shares_viewed_at ON shares (target_user_id, viewed_at);
