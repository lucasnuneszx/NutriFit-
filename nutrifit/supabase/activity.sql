-- NutriFit+ - Atividade (Treino do Dia + streak)
-- Rode no SQL Editor do Supabase.

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

