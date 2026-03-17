-- Permite mensagens de compartilhamento no chat (link + miniatura)
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS metadata jsonb NULL;

COMMENT ON COLUMN messages.metadata IS 'Ex.: { "type": "share", "resource_type": "post", "resource_id": "uuid", "title": "..." }';
