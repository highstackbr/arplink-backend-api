-- Compartilhamento interno (na própria página ou com usuários Arplink)
CREATE TABLE IF NOT EXISTS shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  resource_id uuid NOT NULL,
  resource_type text NOT NULL DEFAULT 'post',
  target_user_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shares_owner_id ON shares (owner_id);
CREATE INDEX IF NOT EXISTS idx_shares_resource ON shares (resource_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_shares_target_user_id ON shares (target_user_id);
