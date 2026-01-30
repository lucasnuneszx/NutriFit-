-- Tabela de Usuários (substitui Supabase Auth)
-- Execute no PostgreSQL do Railway

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

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Atualizar tabela profiles para referenciar users ao invés de auth.users
-- Se profiles já existir, adicionar constraint se necessário
DO $$
BEGIN
  -- Verificar se a coluna id em profiles já referencia users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' 
    AND table_name = 'profiles'
  ) THEN
    -- Se profiles existe mas não tem foreign key, adicionar
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
      ALTER TABLE public.profiles
      DROP CONSTRAINT IF EXISTS profiles_id_fkey;
      
      ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Atualizar outras tabelas que referenciam auth.users
DO $$
BEGIN
  -- Biometrics
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'biometrics') THEN
    ALTER TABLE public.biometrics
    DROP CONSTRAINT IF EXISTS biometrics_user_id_fkey;
    
    ALTER TABLE public.biometrics
    ADD CONSTRAINT biometrics_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;

  -- Logs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'logs') THEN
    ALTER TABLE public.logs
    DROP CONSTRAINT IF EXISTS logs_user_id_fkey;
    
    ALTER TABLE public.logs
    ADD CONSTRAINT logs_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;

  -- Diet plans
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'diet_plans') THEN
    ALTER TABLE public.diet_plans
    DROP CONSTRAINT IF EXISTS diet_plans_user_id_fkey;
    
    ALTER TABLE public.diet_plans
    ADD CONSTRAINT diet_plans_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;

  -- Transactions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
    ALTER TABLE public.transactions
    DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
    
    ALTER TABLE public.transactions
    ADD CONSTRAINT transactions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;

  -- Workout plans
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workout_plans') THEN
    ALTER TABLE public.workout_plans
    DROP CONSTRAINT IF EXISTS workout_plans_user_id_fkey;
    
    ALTER TABLE public.workout_plans
    ADD CONSTRAINT workout_plans_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;

  -- Workout sessions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workout_sessions') THEN
    ALTER TABLE public.workout_sessions
    DROP CONSTRAINT IF EXISTS workout_sessions_user_id_fkey;
    
    ALTER TABLE public.workout_sessions
    ADD CONSTRAINT workout_sessions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

