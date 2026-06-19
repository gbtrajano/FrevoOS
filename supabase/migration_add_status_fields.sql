-- Migration: adiciona colunas status_producao e status_pagamento à tabela ordens_servico
-- Execute este SQL no Supabase SQL Editor (Project > SQL Editor > New Query > Run)

ALTER TABLE public.ordens_servico
  ADD COLUMN IF NOT EXISTS status_producao text NOT NULL DEFAULT 'em_producao'
    CHECK (status_producao IN ('em_producao', 'pronto')),
  ADD COLUMN IF NOT EXISTS status_pagamento text NOT NULL DEFAULT 'pendente'
    CHECK (status_pagamento IN ('pendente', 'pago'));
