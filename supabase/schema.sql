-- =========================================================
-- ÓTICA · SISTEMA DE GESTÃO — SCHEMA SUPABASE
-- Execute este arquivo no SQL Editor do seu projeto Supabase
-- (Project > SQL Editor > New query > Run)
-- =========================================================

-- Extensão usada para gen_random_uuid (já vem habilitada na maioria dos projetos)
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- CLIENTES
-- ---------------------------------------------------------
create table if not exists public.clientes (
  id            bigint generated always as identity primary key,
  nome          text not null,
  cpf           text,
  telefone      text,
  email         text,
  endereco      text,
  observacoes   text,
  status        text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------
-- CATEGORIAS DE PRODUTO
-- ---------------------------------------------------------
create table if not exists public.categorias (
  id            bigint generated always as identity primary key,
  nome          text not null unique,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------
-- PRODUTOS (lentes, armações, acessórios)
-- ---------------------------------------------------------
create table if not exists public.produtos (
  id              bigint generated always as identity primary key,
  nome            text not null,
  tipo_lente      text,
  categoria_id    bigint references public.categorias(id) on delete set null,
  preco           numeric(10,2) not null default 0,
  custo           numeric(10,2) not null default 0,
  estoque         integer not null default 0,
  estoque_minimo  integer not null default 3,
  status          text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------
-- ORÇAMENTOS
-- ---------------------------------------------------------
create table if not exists public.orcamentos (
  id            bigint generated always as identity primary key,
  cliente_id    bigint references public.clientes(id) on delete set null,
  data          date not null default current_date,
  aprovado      boolean not null default false,
  observacoes   text,
  valor_total   numeric(10,2) not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.orcamento_itens (
  id              bigint generated always as identity primary key,
  orcamento_id    bigint not null references public.orcamentos(id) on delete cascade,
  produto_id      bigint references public.produtos(id) on delete set null,
  descricao       text not null,
  quantidade      integer not null default 1,
  valor_unitario  numeric(10,2) not null default 0
);

-- ---------------------------------------------------------
-- ORDENS DE SERVIÇO
-- ---------------------------------------------------------
create table if not exists public.ordens_servico (
  id            bigint generated always as identity primary key,
  cliente_id    bigint references public.clientes(id) on delete set null,
  orcamento_id  bigint references public.orcamentos(id) on delete set null,
  data          date not null default current_date,
  status        text not null default 'solicitado'
                check (status in ('solicitado', 'laboratorio', 'pronto', 'concluido', 'cancelado')),
  observacoes   text,
  desconto      numeric(10,2) not null default 0,
  valor_total   numeric(10,2) not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.os_itens (
  id              bigint generated always as identity primary key,
  os_id           bigint not null references public.ordens_servico(id) on delete cascade,
  produto_id      bigint references public.produtos(id) on delete set null,
  descricao       text not null,
  quantidade      integer not null default 1,
  valor_unitario  numeric(10,2) not null default 0
);

-- ---------------------------------------------------------
-- FINANCEIRO
-- ---------------------------------------------------------
create table if not exists public.contas_pagar (
  id                bigint generated always as identity primary key,
  descricao         text not null,
  categoria         text,
  fornecedor        text,
  valor             numeric(10,2) not null default 0,
  vencimento        date,
  pago              boolean not null default false,
  data_pagamento    date,
  created_at        timestamptz not null default now()
);

create table if not exists public.contas_receber (
  id                bigint generated always as identity primary key,
  descricao         text not null,
  cliente_id        bigint references public.clientes(id) on delete set null,
  valor             numeric(10,2) not null default 0,
  vencimento        date,
  recebido          boolean not null default false,
  data_recebimento  date,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------
-- TRIGGERS — mantém valor_total dos orçamentos / OS em sincronia
-- com a soma dos itens (quantidade * valor_unitario)
-- ---------------------------------------------------------
create or replace function public.recalc_orcamento_total()
returns trigger as $$
begin
  update public.orcamentos
    set valor_total = coalesce((
      select sum(quantidade * valor_unitario)
      from public.orcamento_itens
      where orcamento_id = coalesce(new.orcamento_id, old.orcamento_id)
    ), 0)
    where id = coalesce(new.orcamento_id, old.orcamento_id);
  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_recalc_orcamento_total on public.orcamento_itens;
create trigger trg_recalc_orcamento_total
after insert or update or delete on public.orcamento_itens
for each row execute function public.recalc_orcamento_total();

create or replace function public.recalc_os_total()
returns trigger as $$
begin
  update public.ordens_servico
    set valor_total = greatest(0, coalesce((
      select sum(quantidade * valor_unitario)
      from public.os_itens
      where os_id = coalesce(new.os_id, old.os_id)
    ), 0) - coalesce(desconto, 0))
    where id = coalesce(new.os_id, old.os_id);
  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_recalc_os_total on public.os_itens;
create trigger trg_recalc_os_total
after insert or update or delete on public.os_itens
for each row execute function public.recalc_os_total();

-- ---------------------------------------------------------
-- ROW LEVEL SECURITY
-- Sistema interno: qualquer usuário autenticado (sua equipe,
-- logada via Supabase Auth) pode ler e escrever todos os dados.
-- ---------------------------------------------------------
alter table public.clientes        enable row level security;
alter table public.categorias      enable row level security;
alter table public.produtos        enable row level security;
alter table public.orcamentos      enable row level security;
alter table public.orcamento_itens enable row level security;
alter table public.ordens_servico  enable row level security;
alter table public.os_itens        enable row level security;
alter table public.contas_pagar    enable row level security;
alter table public.contas_receber  enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'clientes','categorias','produtos','orcamentos','orcamento_itens',
    'ordens_servico','os_itens','contas_pagar','contas_receber'
  ])
  loop
    execute format(
      'drop policy if exists "auth_all_%I" on public.%I;', t, t
    );
    execute format(
      'create policy "auth_all_%I" on public.%I for all to authenticated using (true) with check (true);',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------
-- DADOS DE EXEMPLO (opcional — remova se não quiser dados de teste)
-- ---------------------------------------------------------
insert into public.categorias (nome) values
  ('Lentes Multifocais'), ('Lentes Visão Simples'), ('Armações'), ('Solares')
on conflict (nome) do nothing;
