-- NutriFit+ - Dieta (IA) + Lista de compras (persistência)
-- Rode no SQL Editor do Supabase.

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

