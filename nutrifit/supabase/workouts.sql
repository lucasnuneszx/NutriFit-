-- NutriFit+ - Treinos (persistência NutriPlus)
-- Rode no SQL Editor do Supabase.

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

