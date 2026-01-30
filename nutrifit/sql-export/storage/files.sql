-- ============================================
-- Lista de Arquivos do Storage
-- Total: 4 arquivos
-- ============================================

-- Esta tabela é apenas uma referência dos arquivos que estavam no Storage
-- Os arquivos reais precisam ser baixados manualmente ou via script

CREATE TABLE IF NOT EXISTS storage_files (
  id SERIAL PRIMARY KEY,
  bucket TEXT NOT NULL,
  name TEXT NOT NULL,
  size BIGINT,
  mimetype TEXT,
  public_url TEXT,
  created_at TIMESTAMPTZ
);

INSERT INTO storage_files (bucket, name, size, mimetype, public_url, created_at) VALUES ('food', '13ab0883-2dd0-45e0-8c1a-89b71a44a0c3', 0, 'unknown', 'https://icrqzxuaajuxseszdinz.supabase.co/storage/v1/object/public/food/13ab0883-2dd0-45e0-8c1a-89b71a44a0c3', '2026-01-30T15:36:04.276Z');
INSERT INTO storage_files (bucket, name, size, mimetype, public_url, created_at) VALUES ('food', 'd2e0f772-b9b6-4057-b6b9-007c838e267c', 0, 'unknown', 'https://icrqzxuaajuxseszdinz.supabase.co/storage/v1/object/public/food/d2e0f772-b9b6-4057-b6b9-007c838e267c', '2026-01-30T15:36:04.277Z');
INSERT INTO storage_files (bucket, name, size, mimetype, public_url, created_at) VALUES ('logos', '.emptyFolderPlaceholder', 0, 'application/octet-stream', 'https://icrqzxuaajuxseszdinz.supabase.co/storage/v1/object/public/logos/.emptyFolderPlaceholder', '2026-01-15T21:14:11.185Z');
INSERT INTO storage_files (bucket, name, size, mimetype, public_url, created_at) VALUES ('logos', 'ss.png', 9725326, 'image/png', 'https://icrqzxuaajuxseszdinz.supabase.co/storage/v1/object/public/logos/ss.png', '2026-01-15T21:14:19.053Z');
