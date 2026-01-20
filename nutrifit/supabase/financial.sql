-- NutriFit+ - Sistema Financeiro
-- Rode no SQL Editor do Supabase

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
