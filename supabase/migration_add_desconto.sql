-- Migration: adiciona coluna desconto à tabela ordens_servico
-- Execute este SQL no Supabase SQL Editor (Project > SQL Editor > New Query > Run)

ALTER TABLE public.ordens_servico
  ADD COLUMN IF NOT EXISTS desconto numeric(10,2) NOT NULL DEFAULT 0;

-- Atualiza a função de trigger para descontar o valor
CREATE OR REPLACE FUNCTION public.recalc_os_total()
RETURNS trigger AS $$
BEGIN
  UPDATE public.ordens_servico
    SET valor_total = GREATEST(0, COALESCE((
      SELECT SUM(quantidade * valor_unitario)
      FROM public.os_itens
      WHERE os_id = COALESCE(NEW.os_id, OLD.os_id)
    ), 0) - COALESCE(desconto, 0))
    WHERE id = COALESCE(NEW.os_id, OLD.os_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
