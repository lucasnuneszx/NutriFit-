-- NutriFit+ (MVP) - Esquema base para Supabase
-- Cole no SQL Editor do seu projeto Supabase.

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

