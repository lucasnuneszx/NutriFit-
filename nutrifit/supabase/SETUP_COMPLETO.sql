-- ============================================================================
-- NutriFit+ - Setup Completo para Supabase
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================================

-- ============================================================================
-- 1. ADICIONAR COLUNAS À TABELA PROFILES
-- ============================================================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS foto_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS peso NUMERIC,
ADD COLUMN IF NOT EXISTS altura NUMERIC,
ADD COLUMN IF NOT EXISTS objetivo TEXT;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_foto_url ON public.profiles(foto_url);

-- ============================================================================
-- 2. STORAGE - BUCKET PARA IMAGENS DE REFEIÇÕES
-- ============================================================================

-- Criar o bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('food', 'food', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. STORAGE POLICIES - PERMITIR ACESSO AOS ARQUIVOS
-- ============================================================================

-- Policy para INSERT - usuário pode fazer upload apenas na sua pasta
DROP POLICY IF EXISTS "food_insert_own_folder" ON storage.objects;
CREATE POLICY "food_insert_own_folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'food'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy para SELECT - usuário pode ver apenas seus arquivos
DROP POLICY IF EXISTS "food_select_own_folder" ON storage.objects;
CREATE POLICY "food_select_own_folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'food'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy para UPDATE - usuário pode atualizar apenas seus arquivos
DROP POLICY IF EXISTS "food_update_own_folder" ON storage.objects;
CREATE POLICY "food_update_own_folder"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'food'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'food'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy para DELETE - usuário pode deletar apenas seus arquivos
DROP POLICY IF EXISTS "food_delete_own_folder" ON storage.objects;
CREATE POLICY "food_delete_own_folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'food'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- 4. VERIFICAÇÃO - Testar se tudo foi criado corretamente
-- ============================================================================

-- Verificar se as colunas foram criadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('foto_url', 'bio', 'peso', 'altura', 'objetivo')
ORDER BY column_name;

-- Verificar se o bucket existe
SELECT id, name, public FROM storage.buckets WHERE id = 'food';

-- Verificar policies de storage
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- ============================================================================
-- FIM DO SETUP
-- ============================================================================
-- Se todos os selects acima retornarem dados, tudo foi criado com sucesso!
-- Agora você pode usar a aplicação com:
-- - Upload de fotos de perfil
-- - Edição completa do perfil (bio, peso, altura, objetivo)
-- - Histórico de fotos de refeições
