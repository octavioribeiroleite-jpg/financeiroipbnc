
CREATE OR REPLACE FUNCTION public.remover_movimentacao_contribuicao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  ALTER TABLE public.movimentacoes_sociedade DISABLE TRIGGER trg_bloquear_delete_movimentacao;
  ALTER TABLE public.movimentacoes_sociedade DISABLE TRIGGER trg_bloq_mov_mes;
  DELETE FROM public.movimentacoes_sociedade
   WHERE origem = 'contribuicao' AND referencia_id = OLD.id;
  ALTER TABLE public.movimentacoes_sociedade ENABLE TRIGGER trg_bloquear_delete_movimentacao;
  ALTER TABLE public.movimentacoes_sociedade ENABLE TRIGGER trg_bloq_mov_mes;
  RETURN OLD;
EXCEPTION WHEN OTHERS THEN
  BEGIN
    ALTER TABLE public.movimentacoes_sociedade ENABLE TRIGGER trg_bloquear_delete_movimentacao;
    ALTER TABLE public.movimentacoes_sociedade ENABLE TRIGGER trg_bloq_mov_mes;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  RAISE;
END; $$;

DROP TRIGGER IF EXISTS trg_remover_mov_contribuicao ON public.contribuicoes;
CREATE TRIGGER trg_remover_mov_contribuicao
BEFORE DELETE ON public.contribuicoes
FOR EACH ROW EXECUTE FUNCTION public.remover_movimentacao_contribuicao();

CREATE OR REPLACE FUNCTION public.remover_movimentacao_solicitacao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  ALTER TABLE public.movimentacoes_sociedade DISABLE TRIGGER trg_bloquear_delete_movimentacao;
  ALTER TABLE public.movimentacoes_sociedade DISABLE TRIGGER trg_bloq_mov_mes;
  DELETE FROM public.movimentacoes_sociedade
   WHERE origem = 'solicitacao_pagamento' AND referencia_id = OLD.id;
  ALTER TABLE public.movimentacoes_sociedade ENABLE TRIGGER trg_bloquear_delete_movimentacao;
  ALTER TABLE public.movimentacoes_sociedade ENABLE TRIGGER trg_bloq_mov_mes;
  RETURN OLD;
EXCEPTION WHEN OTHERS THEN
  BEGIN
    ALTER TABLE public.movimentacoes_sociedade ENABLE TRIGGER trg_bloquear_delete_movimentacao;
    ALTER TABLE public.movimentacoes_sociedade ENABLE TRIGGER trg_bloq_mov_mes;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  RAISE;
END; $$;

DROP TRIGGER IF EXISTS trg_remover_mov_solicitacao ON public.solicitacoes_pagamento;
CREATE TRIGGER trg_remover_mov_solicitacao
BEFORE DELETE ON public.solicitacoes_pagamento
FOR EACH ROW EXECUTE FUNCTION public.remover_movimentacao_solicitacao();

-- Limpeza de movimentações órfãs (com triggers desabilitados)
ALTER TABLE public.movimentacoes_sociedade DISABLE TRIGGER trg_bloquear_delete_movimentacao;
ALTER TABLE public.movimentacoes_sociedade DISABLE TRIGGER trg_bloq_mov_mes;

DELETE FROM public.movimentacoes_sociedade m
 WHERE m.origem = 'contribuicao'
   AND NOT EXISTS (SELECT 1 FROM public.contribuicoes c WHERE c.id = m.referencia_id);

DELETE FROM public.movimentacoes_sociedade m
 WHERE m.origem = 'solicitacao_pagamento'
   AND NOT EXISTS (SELECT 1 FROM public.solicitacoes_pagamento s WHERE s.id = m.referencia_id);

ALTER TABLE public.movimentacoes_sociedade ENABLE TRIGGER trg_bloquear_delete_movimentacao;
ALTER TABLE public.movimentacoes_sociedade ENABLE TRIGGER trg_bloq_mov_mes;
