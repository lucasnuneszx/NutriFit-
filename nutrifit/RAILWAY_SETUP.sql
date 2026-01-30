-- ============================================
-- NutriFit+ - Setup Completo para Railway PostgreSQL
-- Copie e cole este SQL no Railway Query Editor
-- ============================================

-- ============================================
-- 0. TABELA DE USUÁRIOS (substitui Supabase Auth)
-- ============================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nome TEXT,
  nome_assistente TEXT DEFAULT 'Athena',
  tipo_plano TEXT NOT NULL DEFAULT 'free' CHECK (tipo_plano IN ('free', 'plus')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_tipo_plano_idx ON public.users(tipo_plano);

-- ============================================
-- 1. FUNÇÃO PARA ATUALIZAR atualizado_em
-- ============================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para users
DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- 2. PROFILES (Perfil do usuário)
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  tipo_plano TEXT NOT NULL DEFAULT 'free' CHECK (tipo_plano IN ('free', 'plus')),
  nome_assistente TEXT,
  contagem_streak INTEGER NOT NULL DEFAULT 0,
  foto_url TEXT,
  bio TEXT,
  peso NUMERIC,
  altura NUMERIC,
  objetivo TEXT,
  plano_pausado BOOLEAN NOT NULL DEFAULT false,
  plano_expira_em TIMESTAMPTZ,
  plano_iniciado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_tipo_plano_idx ON public.profiles(tipo_plano);
CREATE INDEX IF NOT EXISTS profiles_plano_pausado_idx ON public.profiles(plano_pausado);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- 3. BIOMETRICS (Dados biométricos)
-- ============================================

CREATE TABLE IF NOT EXISTS public.biometrics (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  peso NUMERIC,
  altura NUMERIC,
  idade INTEGER,
  genero TEXT,
  nivel_atividade TEXT,
  condicoes_medicas JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_biometrics_updated_at ON public.biometrics;
CREATE TRIGGER trg_biometrics_updated_at
BEFORE UPDATE ON public.biometrics
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- 4. LOGS (Scans de refeição)
-- ============================================

CREATE TABLE IF NOT EXISTS public.logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  imagem_url TEXT,
  dados_alimento JSONB,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS logs_user_id_idx ON public.logs(user_id);
CREATE INDEX IF NOT EXISTS logs_criado_em_idx ON public.logs(criado_em DESC);

-- ============================================
-- 5. DIET PLANS (Planos de dieta)
-- ============================================

CREATE TABLE IF NOT EXISTS public.diet_plans (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal TEXT NOT NULL CHECK (goal IN ('cutting', 'bulking')),
  calories_target INTEGER,
  protein_g INTEGER,
  carbs_g INTEGER,
  fats_g INTEGER,
  plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  groceries JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS diet_plans_user_created_idx
ON public.diet_plans(user_id, created_at DESC);

-- ============================================
-- 6. WORKOUT PLANS (Planos de treino)
-- ============================================

CREATE TABLE IF NOT EXISTS public.workout_plans (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Meu treino',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS workout_plans_user_unique 
ON public.workout_plans(user_id);

-- ============================================
-- 7. WORKOUT ITEMS (Exercícios do plano)
-- ============================================

CREATE TABLE IF NOT EXISTS public.workout_items (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  group_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  variation_id TEXT NOT NULL,
  exercise_title TEXT,
  variation_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workout_items_plan_id_idx 
ON public.workout_items(plan_id);

-- ============================================
-- 8. WORKOUT SESSIONS (Sessões de treino)
-- ============================================

CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  performed_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS workout_sessions_user_day_unique
ON public.workout_sessions(user_id, performed_on);

CREATE INDEX IF NOT EXISTS workout_sessions_user_id_idx 
ON public.workout_sessions(user_id);

-- ============================================
-- 9. WORKOUT SESSION ITEMS (Itens da sessão)
-- ============================================

CREATE TABLE IF NOT EXISTS public.workout_session_items (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  workout_item_id BIGINT NOT NULL REFERENCES public.workout_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS workout_session_items_unique
ON public.workout_session_items(session_id, workout_item_id);

CREATE INDEX IF NOT EXISTS workout_session_items_session_id_idx 
ON public.workout_session_items(session_id);

-- ============================================
-- 10. WORKOUT SETS (Séries do treino)
-- ============================================

CREATE TABLE IF NOT EXISTS public.workout_sets (
  id BIGSERIAL PRIMARY KEY,
  session_item_id BIGINT NOT NULL REFERENCES public.workout_session_items(id) ON DELETE CASCADE,
  set_index INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_kg NUMERIC NOT NULL,
  rpe NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workout_sets_session_item_idx
ON public.workout_sets(session_item_id, set_index);

-- ============================================
-- 11. TRANSACTIONS (Transações/Pagamentos)
-- ============================================

CREATE TABLE IF NOT EXISTS public.transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('assinatura', 'renovacao', 'upgrade', 'cancelamento', 'reembolso')),
  plano TEXT NOT NULL CHECK (plano IN ('free', 'plus')),
  valor NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado', 'reembolsado')),
  metodo_pagamento TEXT,
  referencia_externa TEXT,
  notas TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transactions_user_idx ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON public.transactions(status);
CREATE INDEX IF NOT EXISTS transactions_criado_idx ON public.transactions(criado_em DESC);
CREATE INDEX IF NOT EXISTS transactions_tipo_idx ON public.transactions(tipo);
CREATE INDEX IF NOT EXISTS transactions_referencia_externa_idx ON public.transactions(referencia_externa);

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON public.transactions;
CREATE TRIGGER trg_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- 12. FUNÇÕES ADMINISTRATIVAS
-- ============================================

-- Função para admin listar todos os profiles
CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS TABLE (
  id UUID,
  nome TEXT,
  email TEXT,
  tipo_plano TEXT,
  nome_assistente TEXT,
  contagem_streak INTEGER,
  plano_pausado BOOLEAN,
  plano_expira_em TIMESTAMPTZ,
  plano_iniciado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ,
  atualizado_em TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.nome,
    p.email,
    p.tipo_plano,
    p.nome_assistente,
    p.contagem_streak,
    p.plano_pausado,
    p.plano_expira_em,
    p.plano_iniciado_em,
    p.criado_em,
    p.atualizado_em
  FROM public.profiles p
  ORDER BY p.criado_em DESC;
END;
$$;

-- Função para admin atualizar plano
CREATE OR REPLACE FUNCTION public.admin_update_user_plan(
  target_user_id UUID,
  new_tipo_plano TEXT DEFAULT NULL,
  new_pausado BOOLEAN DEFAULT NULL,
  new_expira_em TIMESTAMPTZ DEFAULT NULL,
  new_iniciado_em TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.profiles
  SET
    tipo_plano = COALESCE(new_tipo_plano, tipo_plano),
    plano_pausado = COALESCE(new_pausado, plano_pausado),
    plano_expira_em = COALESCE(new_expira_em, plano_expira_em),
    plano_iniciado_em = COALESCE(new_iniciado_em, plano_iniciado_em),
    atualizado_em = NOW()
  WHERE id = target_user_id;
  
  RETURN FOUND;
END;
$$;

-- Função para admin ver todas as transações
CREATE OR REPLACE FUNCTION public.admin_list_transactions()
RETURNS TABLE (
  id BIGINT,
  user_id UUID,
  tipo TEXT,
  plano TEXT,
  valor NUMERIC,
  status TEXT,
  metodo_pagamento TEXT,
  referencia_externa TEXT,
  notas TEXT,
  criado_em TIMESTAMPTZ,
  atualizado_em TIMESTAMPTZ,
  user_nome TEXT,
  user_email TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.user_id,
    t.tipo,
    t.plano,
    t.valor,
    t.status,
    t.metodo_pagamento,
    t.referencia_externa,
    t.notas,
    t.criado_em,
    t.atualizado_em,
    p.nome AS user_nome,
    p.email AS user_email
  FROM public.transactions t
  LEFT JOIN public.profiles p ON p.id = t.user_id
  ORDER BY t.criado_em DESC;
END;
$$;

-- Função para estatísticas financeiras
CREATE OR REPLACE FUNCTION public.admin_financial_stats()
RETURNS TABLE (
  receita_total NUMERIC,
  receita_mes_atual NUMERIC,
  receita_mes_anterior NUMERIC,
  assinaturas_ativas INTEGER,
  assinaturas_canceladas INTEGER,
  transacoes_pagas INTEGER,
  transacoes_pendentes INTEGER
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_receita_total NUMERIC := 0;
  v_receita_mes_atual NUMERIC := 0;
  v_receita_mes_anterior NUMERIC := 0;
  v_assinaturas_ativas INTEGER := 0;
  v_assinaturas_canceladas INTEGER := 0;
  v_transacoes_pagas INTEGER := 0;
  v_transacoes_pendentes INTEGER := 0;
BEGIN
  -- Receita total (apenas pagas)
  SELECT COALESCE(SUM(valor), 0) INTO v_receita_total
  FROM public.transactions
  WHERE status = 'pago';

  -- Receita mês atual
  SELECT COALESCE(SUM(valor), 0) INTO v_receita_mes_atual
  FROM public.transactions
  WHERE status = 'pago'
    AND DATE_TRUNC('month', criado_em) = DATE_TRUNC('month', NOW());

  -- Receita mês anterior
  SELECT COALESCE(SUM(valor), 0) INTO v_receita_mes_anterior
  FROM public.transactions
  WHERE status = 'pago'
    AND DATE_TRUNC('month', criado_em) = DATE_TRUNC('month', NOW() - INTERVAL '1 month');

  -- Assinaturas ativas (Plus não pausado e não expirado)
  SELECT COUNT(*) INTO v_assinaturas_ativas
  FROM public.profiles
  WHERE tipo_plano = 'plus'
    AND plano_pausado = false
    AND (plano_expira_em IS NULL OR plano_expira_em > NOW());

  -- Assinaturas canceladas (Free que já foi Plus)
  SELECT COUNT(*) INTO v_assinaturas_canceladas
  FROM public.profiles
  WHERE tipo_plano = 'free'
    AND EXISTS (
      SELECT 1 FROM public.transactions
      WHERE transactions.user_id = profiles.id
        AND transactions.tipo IN ('assinatura', 'renovacao')
        AND transactions.status = 'pago'
    );

  -- Transações pagas
  SELECT COUNT(*) INTO v_transacoes_pagas
  FROM public.transactions
  WHERE status = 'pago';

  -- Transações pendentes
  SELECT COUNT(*) INTO v_transacoes_pendentes
  FROM public.transactions
  WHERE status = 'pendente';

  RETURN QUERY SELECT
    v_receita_total,
    v_receita_mes_atual,
    v_receita_mes_anterior,
    v_assinaturas_ativas,
    v_assinaturas_canceladas,
    v_transacoes_pagas,
    v_transacoes_pendentes;
END;
$$;

-- ============================================
-- ✅ SETUP COMPLETO!
-- ============================================

-- Verificar tabelas criadas
SELECT 
  'Tabelas criadas:' as info,
  COUNT(*) as total
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

