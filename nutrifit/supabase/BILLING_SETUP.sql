-- ============================================================================
-- NutriFit+ - Setup de Cobrança e Faturas
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================================

-- ============================================================================
-- 1. CRIAR TABELA DE FATURAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data_emissao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  data_vencimento TIMESTAMP WITH TIME ZONE NOT NULL,
  data_pagamento TIMESTAMP WITH TIME ZONE,
  valor_total NUMERIC(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue, cancelled
  descricao TEXT,
  numero_fatura VARCHAR(50),
  metodo_pagamento VARCHAR(50), -- credit_card, debit, pix, etc
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_data_vencimento ON public.invoices(data_vencimento);

-- ============================================================================
-- 2. CRIAR TABELA DE MÉTODOS DE PAGAMENTO
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- credit_card, debit_card, pix
  principal BOOLEAN DEFAULT FALSE,
  dados_criptografados BYTEA, -- Dados sensíveis do cartão (criptografados)
  ultimos_digitos VARCHAR(4), -- Últimos 4 dígitos do cartão
  validade_mes INTEGER, -- Mês de validade (1-12)
  validade_ano INTEGER, -- Ano de validade
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_principal ON public.payment_methods(principal);

-- ============================================================================
-- 3. ADICIONAR COLUNA DE PRÓXIMA DATA DE COBRANÇA EM PROFILES
-- ============================================================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS proximo_vencimento TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS metodo_pagamento_principal_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status_cobranca VARCHAR(20) DEFAULT 'ativo'; -- ativo, suspenso, cancelado

-- ============================================================================
-- 4. RLS (ROW LEVEL SECURITY) POLICIES
-- ============================================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Políticas para invoices
DROP POLICY IF EXISTS "invoices_select_own" ON public.invoices;
CREATE POLICY "invoices_select_own"
ON public.invoices FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "invoices_insert_own" ON public.invoices;
CREATE POLICY "invoices_insert_own"
ON public.invoices FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Políticas para payment_methods
DROP POLICY IF EXISTS "payment_methods_select_own" ON public.payment_methods;
CREATE POLICY "payment_methods_select_own"
ON public.payment_methods FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "payment_methods_insert_own" ON public.payment_methods;
CREATE POLICY "payment_methods_insert_own"
ON public.payment_methods FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payment_methods_update_own" ON public.payment_methods;
CREATE POLICY "payment_methods_update_own"
ON public.payment_methods FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payment_methods_delete_own" ON public.payment_methods;
CREATE POLICY "payment_methods_delete_own"
ON public.payment_methods FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- 5. INSERIR DADOS DE EXEMPLO (FATURAS)
-- ============================================================================

-- Inserir algumas faturas de exemplo para o usuário Lucas
-- Primeiro, obter o ID do Lucas (nutriadm@admin.com)
INSERT INTO public.invoices (
  user_id,
  data_vencimento,
  valor_total,
  status,
  descricao,
  numero_fatura,
  metodo_pagamento
)
SELECT 
  id,
  CURRENT_TIMESTAMP + INTERVAL '5 days',
  99.90,
  'pending',
  'Assinatura NutriPlus - Janeiro 2026',
  'INV-2026-01-001',
  'credit_card'
FROM public.profiles
WHERE email = 'nutriadm@admin.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.invoices (
  user_id,
  data_vencimento,
  data_pagamento,
  valor_total,
  status,
  descricao,
  numero_fatura,
  metodo_pagamento
)
SELECT 
  id,
  CURRENT_TIMESTAMP - INTERVAL '5 days',
  CURRENT_TIMESTAMP - INTERVAL '2 days',
  99.90,
  'paid',
  'Assinatura NutriPlus - Dezembro 2025',
  'INV-2025-12-001',
  'credit_card'
FROM public.profiles
WHERE email = 'nutriadm@admin.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.invoices (
  user_id,
  data_vencimento,
  data_pagamento,
  valor_total,
  status,
  descricao,
  numero_fatura,
  metodo_pagamento
)
SELECT 
  id,
  CURRENT_TIMESTAMP - INTERVAL '35 days',
  CURRENT_TIMESTAMP - INTERVAL '32 days',
  99.90,
  'paid',
  'Assinatura NutriPlus - Novembro 2025',
  'INV-2025-11-001',
  'credit_card'
FROM public.profiles
WHERE email = 'nutriadm@admin.com'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. VERIFICAÇÃO
-- ============================================================================

-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('invoices', 'payment_methods')
ORDER BY table_name;

-- Verificar as colunas da tabela invoices
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invoices'
ORDER BY column_name;

-- Verificar as políticas de RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('invoices', 'payment_methods')
ORDER BY tablename, policyname;

-- ============================================================================
-- FIM DO SETUP DE COBRANÇA
-- ============================================================================
