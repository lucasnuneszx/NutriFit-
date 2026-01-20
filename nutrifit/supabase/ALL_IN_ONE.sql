-- ============================================
-- NutriFit+ - Setup Completo do Banco de Dados
-- Execute este arquivo UMA VEZ no SQL Editor do Supabase
-- ============================================

-- ============================================
-- 1. SCHEMA BASE (Profiles, Biometrics, Logs)
-- ============================================

-- 1) PROFILES (equivalente ao "users" do app, mas separado do auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  email text,
  tipo_plano text not null default 'free' check (tipo_plano in ('free', 'plus')),
  nome_assistente text,
  contagem_streak integer not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- 2) BIOMETRICS
create table if not exists public.biometrics (
  user_id uuid primary key references auth.users(id) on delete cascade,
  peso numeric,
  altura numeric,
  idade integer,
  genero text,
  nivel_atividade text,
  condicoes_medicas jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- 3) LOGS (scans de refeição)
create table if not exists public.logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  imagem_url text,
  dados_alimento jsonb,
  criado_em timestamptz not null default now()
);

-- Atualiza atualizado_em automaticamente
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_biometrics_updated_at on public.biometrics;
create trigger trg_biometrics_updated_at
before update on public.biometrics
for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.biometrics enable row level security;
alter table public.logs enable row level security;

-- Policies: profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Policies: biometrics
drop policy if exists "biometrics_select_own" on public.biometrics;
create policy "biometrics_select_own"
on public.biometrics for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "biometrics_upsert_own" on public.biometrics;
create policy "biometrics_upsert_own"
on public.biometrics for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "biometrics_update_own" on public.biometrics;
create policy "biometrics_update_own"
on public.biometrics for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Policies: logs
drop policy if exists "logs_select_own" on public.logs;
create policy "logs_select_own"
on public.logs for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "logs_insert_own" on public.logs;
create policy "logs_insert_own"
on public.logs for insert
to authenticated
with check (user_id = auth.uid());

-- ============================================
-- 2. STORAGE (Bucket para imagens)
-- ============================================

-- Bucket para imagens de refeições
insert into storage.buckets (id, name, public)
values ('food', 'food', false)
on conflict (id) do nothing;

-- Policies: permitir que o usuário gerencie apenas arquivos na pasta do seu user_id
drop policy if exists "food_insert_own_folder" on storage.objects;
create policy "food_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'food'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "food_select_own_folder" on storage.objects;
create policy "food_select_own_folder"
on storage.objects for select
to authenticated
using (
  bucket_id = 'food'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "food_update_own_folder" on storage.objects;
create policy "food_update_own_folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'food'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'food'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "food_delete_own_folder" on storage.objects;
create policy "food_delete_own_folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'food'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 3. WORKOUTS (Treinos)
-- ============================================

create table if not exists public.workout_plans (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Meu treino',
  created_at timestamptz not null default now()
);

create unique index if not exists workout_plans_user_unique on public.workout_plans(user_id);

create table if not exists public.workout_items (
  id bigserial primary key,
  plan_id bigint not null references public.workout_plans(id) on delete cascade,
  group_id text not null,
  exercise_id text not null,
  variation_id text not null,
  exercise_title text,
  variation_title text,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.workout_plans enable row level security;
alter table public.workout_items enable row level security;

-- workout_plans: só o dono
drop policy if exists "workout_plans_select_own" on public.workout_plans;
create policy "workout_plans_select_own"
on public.workout_plans for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "workout_plans_insert_own" on public.workout_plans;
create policy "workout_plans_insert_own"
on public.workout_plans for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "workout_plans_update_own" on public.workout_plans;
create policy "workout_plans_update_own"
on public.workout_plans for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "workout_plans_delete_own" on public.workout_plans;
create policy "workout_plans_delete_own"
on public.workout_plans for delete
to authenticated
using (user_id = auth.uid());

-- workout_items: acesso via join implícito (verifica dono do plano)
drop policy if exists "workout_items_select_own" on public.workout_items;
create policy "workout_items_select_own"
on public.workout_items for select
to authenticated
using (
  exists (
    select 1 from public.workout_plans p
    where p.id = workout_items.plan_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "workout_items_insert_own" on public.workout_items;
create policy "workout_items_insert_own"
on public.workout_items for insert
to authenticated
with check (
  exists (
    select 1 from public.workout_plans p
    where p.id = workout_items.plan_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "workout_items_delete_own" on public.workout_items;
create policy "workout_items_delete_own"
on public.workout_items for delete
to authenticated
using (
  exists (
    select 1 from public.workout_plans p
    where p.id = workout_items.plan_id
      and p.user_id = auth.uid()
  )
);

-- ============================================
-- 4. ACTIVITY (Treino do Dia + streak)
-- ============================================

create table if not exists public.workout_sessions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  performed_on date not null default current_date,
  created_at timestamptz not null default now()
);

create unique index if not exists workout_sessions_user_day_unique
on public.workout_sessions(user_id, performed_on);

alter table public.workout_sessions enable row level security;

drop policy if exists "workout_sessions_select_own" on public.workout_sessions;
create policy "workout_sessions_select_own"
on public.workout_sessions for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "workout_sessions_insert_own" on public.workout_sessions;
create policy "workout_sessions_insert_own"
on public.workout_sessions for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "workout_sessions_delete_own" on public.workout_sessions;
create policy "workout_sessions_delete_own"
on public.workout_sessions for delete
to authenticated
using (user_id = auth.uid());

-- ============================================
-- 5. SESSION DETAILS (Itens + séries)
-- ============================================

create table if not exists public.workout_session_items (
  id bigserial primary key,
  session_id bigint not null references public.workout_sessions(id) on delete cascade,
  workout_item_id bigint not null references public.workout_items(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists workout_session_items_unique
on public.workout_session_items(session_id, workout_item_id);

create table if not exists public.workout_sets (
  id bigserial primary key,
  session_item_id bigint not null references public.workout_session_items(id) on delete cascade,
  set_index integer not null,
  reps integer not null,
  weight_kg numeric not null,
  rpe numeric,
  created_at timestamptz not null default now()
);

create index if not exists workout_sets_session_item_idx
on public.workout_sets(session_item_id, set_index);

-- RLS
alter table public.workout_session_items enable row level security;
alter table public.workout_sets enable row level security;

-- workout_session_items: acesso somente se a sessão for do usuário
drop policy if exists "workout_session_items_select_own" on public.workout_session_items;
create policy "workout_session_items_select_own"
on public.workout_session_items for select
to authenticated
using (
  exists (
    select 1 from public.workout_sessions s
    where s.id = workout_session_items.session_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "workout_session_items_insert_own" on public.workout_session_items;
create policy "workout_session_items_insert_own"
on public.workout_session_items for insert
to authenticated
with check (
  exists (
    select 1 from public.workout_sessions s
    where s.id = workout_session_items.session_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "workout_session_items_delete_own" on public.workout_session_items;
create policy "workout_session_items_delete_own"
on public.workout_session_items for delete
to authenticated
using (
  exists (
    select 1 from public.workout_sessions s
    where s.id = workout_session_items.session_id
      and s.user_id = auth.uid()
  )
);

-- workout_sets: acesso somente se o session_item for do usuário
drop policy if exists "workout_sets_select_own" on public.workout_sets;
create policy "workout_sets_select_own"
on public.workout_sets for select
to authenticated
using (
  exists (
    select 1
    from public.workout_session_items si
    join public.workout_sessions s on s.id = si.session_id
    where si.id = workout_sets.session_item_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "workout_sets_insert_own" on public.workout_sets;
create policy "workout_sets_insert_own"
on public.workout_sets for insert
to authenticated
with check (
  exists (
    select 1
    from public.workout_session_items si
    join public.workout_sessions s on s.id = si.session_id
    where si.id = workout_sets.session_item_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "workout_sets_delete_own" on public.workout_sets;
create policy "workout_sets_delete_own"
on public.workout_sets for delete
to authenticated
using (
  exists (
    select 1
    from public.workout_session_items si
    join public.workout_sessions s on s.id = si.session_id
    where si.id = workout_sets.session_item_id
      and s.user_id = auth.uid()
  )
);

-- ============================================
-- 6. DIET (Dieta + Lista de compras)
-- ============================================

create table if not exists public.diet_plans (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  goal text not null check (goal in ('cutting', 'bulking')),
  calories_target integer,
  protein_g integer,
  carbs_g integer,
  fats_g integer,
  plan jsonb not null default '{}'::jsonb,
  groceries jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists diet_plans_user_created_idx
on public.diet_plans(user_id, created_at desc);

alter table public.diet_plans enable row level security;

drop policy if exists "diet_plans_select_own" on public.diet_plans;
create policy "diet_plans_select_own"
on public.diet_plans for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "diet_plans_insert_own" on public.diet_plans;
create policy "diet_plans_insert_own"
on public.diet_plans for insert
to authenticated
with check (user_id = auth.uid());

-- ============================================
-- 7. ADMIN MIGRATION (Campos de admin)
-- ============================================

-- Adiciona colunas de gerenciamento de plano
alter table public.profiles
add column if not exists plano_pausado boolean not null default false,
add column if not exists plano_expira_em timestamptz,
add column if not exists plano_iniciado_em timestamptz;

-- Cria índice para busca rápida
create index if not exists profiles_tipo_plano_idx on public.profiles(tipo_plano);
create index if not exists profiles_plano_pausado_idx on public.profiles(plano_pausado);

-- Função para admin listar todos os profiles (requer service_role)
create or replace function public.admin_list_profiles()
returns table (
  id uuid,
  nome text,
  email text,
  tipo_plano text,
  nome_assistente text,
  contagem_streak integer,
  plano_pausado boolean,
  plano_expira_em timestamptz,
  plano_iniciado_em timestamptz,
  criado_em timestamptz,
  atualizado_em timestamptz
)
security definer
set search_path = public
language plpgsql
as $$
begin
  return query
  select
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
  from public.profiles p
  order by p.criado_em desc;
end;
$$;

-- Função para admin atualizar plano (requer service_role)
create or replace function public.admin_update_user_plan(
  target_user_id uuid,
  new_tipo_plano text default null,
  new_pausado boolean default null,
  new_expira_em timestamptz default null,
  new_iniciado_em timestamptz default null
)
returns boolean
security definer
set search_path = public
language plpgsql
as $$
begin
  update public.profiles
  set
    tipo_plano = coalesce(new_tipo_plano, tipo_plano),
    plano_pausado = coalesce(new_pausado, plano_pausado),
    plano_expira_em = coalesce(new_expira_em, plano_expira_em),
    plano_iniciado_em = coalesce(new_iniciado_em, plano_iniciado_em),
    atualizado_em = now()
  where id = target_user_id;
  
  return found;
end;
$$;

-- ============================================
-- 8. FINANCIAL (Sistema Financeiro)
-- ============================================

-- Tabela de transações/pagamentos
create table if not exists public.transactions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('assinatura', 'renovacao', 'upgrade', 'cancelamento', 'reembolso')),
  plano text not null check (plano in ('free', 'plus')),
  valor numeric(10, 2) not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'cancelado', 'reembolsado')),
  metodo_pagamento text,
  referencia_externa text,
  notas text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists transactions_user_idx on public.transactions(user_id);
create index if not exists transactions_status_idx on public.transactions(status);
create index if not exists transactions_criado_idx on public.transactions(criado_em desc);
create index if not exists transactions_tipo_idx on public.transactions(tipo);

-- Trigger para atualizar atualizado_em
drop trigger if exists trg_transactions_updated_at on public.transactions;
create trigger trg_transactions_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

-- RLS
alter table public.transactions enable row level security;

-- Policy: usuários veem apenas suas próprias transações
drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own"
on public.transactions for select
to authenticated
using (user_id = auth.uid());

-- Função para admin ver todas as transações
create or replace function public.admin_list_transactions()
returns table (
  id bigint,
  user_id uuid,
  tipo text,
  plano text,
  valor numeric,
  status text,
  metodo_pagamento text,
  referencia_externa text,
  notas text,
  criado_em timestamptz,
  atualizado_em timestamptz,
  user_nome text,
  user_email text
)
security definer
set search_path = public
language plpgsql
as $$
begin
  return query
  select
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
    p.nome as user_nome,
    p.email as user_email
  from public.transactions t
  left join public.profiles p on p.id = t.user_id
  order by t.criado_em desc;
end;
$$;

-- Função para estatísticas financeiras
create or replace function public.admin_financial_stats()
returns table (
  receita_total numeric,
  receita_mes_atual numeric,
  receita_mes_anterior numeric,
  assinaturas_ativas integer,
  assinaturas_canceladas integer,
  transacoes_pagas integer,
  transacoes_pendentes integer
)
security definer
set search_path = public
language plpgsql
as $$
declare
  v_receita_total numeric := 0;
  v_receita_mes_atual numeric := 0;
  v_receita_mes_anterior numeric := 0;
  v_assinaturas_ativas integer := 0;
  v_assinaturas_canceladas integer := 0;
  v_transacoes_pagas integer := 0;
  v_transacoes_pendentes integer := 0;
begin
  -- Receita total (apenas pagas)
  select coalesce(sum(valor), 0) into v_receita_total
  from public.transactions
  where status = 'pago';

  -- Receita mês atual
  select coalesce(sum(valor), 0) into v_receita_mes_atual
  from public.transactions
  where status = 'pago'
    and date_trunc('month', criado_em) = date_trunc('month', now());

  -- Receita mês anterior
  select coalesce(sum(valor), 0) into v_receita_mes_anterior
  from public.transactions
  where status = 'pago'
    and date_trunc('month', criado_em) = date_trunc('month', now() - interval '1 month');

  -- Assinaturas ativas (Plus não pausado e não expirado)
  select count(*) into v_assinaturas_ativas
  from public.profiles
  where tipo_plano = 'plus'
    and plano_pausado = false
    and (plano_expira_em is null or plano_expira_em > now());

  -- Assinaturas canceladas (Free que já foi Plus)
  select count(*) into v_assinaturas_canceladas
  from public.profiles
  where tipo_plano = 'free'
    and exists (
      select 1 from public.transactions
      where transactions.user_id = profiles.id
        and transactions.tipo in ('assinatura', 'renovacao')
        and transactions.status = 'pago'
    );

  -- Transações pagas
  select count(*) into v_transacoes_pagas
  from public.transactions
  where status = 'pago';

  -- Transações pendentes
  select count(*) into v_transacoes_pendentes
  from public.transactions
  where status = 'pendente';

  return query select
    v_receita_total,
    v_receita_mes_atual,
    v_receita_mes_anterior,
    v_assinaturas_ativas,
    v_assinaturas_canceladas,
    v_transacoes_pagas,
    v_transacoes_pendentes;
end;
$$;

-- ============================================
-- ✅ SETUP COMPLETO!
-- ============================================
