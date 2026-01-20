-- Adicionar coluna foto_url à tabela profiles se não existir
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Adicionar outras colunas opcionais para dados do perfil
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS peso NUMERIC,
ADD COLUMN IF NOT EXISTS altura NUMERIC,
ADD COLUMN IF NOT EXISTS objetivo TEXT;

-- Criar índice para foto_url se não existir
CREATE INDEX IF NOT EXISTS idx_profiles_foto_url ON public.profiles(foto_url);
