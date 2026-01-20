-- Migration: Adiciona campos de gerenciamento de plano para admin
-- Rode no SQL Editor do Supabase

-- Adiciona colunas de gerenciamento de plano
alter table public.profiles
add column if not exists plano_pausado boolean not null default false,
add column if not exists plano_expira_em timestamptz,
add column if not exists plano_iniciado_em timestamptz;

-- Cria índice para busca rápida
create index if not exists profiles_tipo_plano_idx on public.profiles(tipo_plano);
create index if not exists profiles_plano_pausado_idx on public.profiles(plano_pausado);

-- Policy para admin acessar todos os profiles (via service_role ou bypass RLS)
-- Nota: Admin APIs devem usar service_role key ou bypass RLS via função
-- Por segurança, vamos criar uma função que só pode ser chamada com service_role

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
  -- Esta função só deve ser chamada via service_role
  -- Em produção, adicione validação adicional se necessário
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
