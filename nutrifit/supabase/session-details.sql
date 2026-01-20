-- NutriFit+ - Treino do Dia (itens + séries)
-- Rode no SQL Editor do Supabase.

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

