-- Adicionar campo foto_url na tabela profiles
-- Execute no SQL Editor do Supabase

-- Adiciona a coluna foto_url se não existir
alter table public.profiles
add column if not exists foto_url text;

-- Verifica se a coluna foi adicionada
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND column_name = 'foto_url';
