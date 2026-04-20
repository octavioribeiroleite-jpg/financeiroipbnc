-- 1) Remover triggers duplicados em solicitacoes_pagamento
DROP TRIGGER IF EXISTS trg_solicitacao_pagamento ON public.solicitacoes_pagamento;
DROP TRIGGER IF EXISTS trg_bloquear_excl_pagamento ON public.solicitacoes_pagamento;

-- 2) Remover trigger duplicado em movimentacoes_sociedade
DROP TRIGGER IF EXISTS trg_bloquear_excl_movimentacao ON public.movimentacoes_sociedade;

-- 3) Limpar movimentações duplicadas já geradas pelo trigger duplicado.
-- Para cada (origem, referencia_id, tipo, valor, data_movimento) com mais de uma linha,
-- mantém a mais antiga e remove as demais. Como há trigger BEFORE DELETE bloqueando
-- exclusão de movimentações confirmadas, desabilitamos temporariamente para a limpeza.
ALTER TABLE public.movimentacoes_sociedade DISABLE TRIGGER trg_bloquear_delete_movimentacao;

WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY origem, referencia_id, tipo, valor, data_movimento, sociedade_id
           ORDER BY data_criacao ASC, id ASC
         ) AS rn
  FROM public.movimentacoes_sociedade
  WHERE referencia_id IS NOT NULL
)
DELETE FROM public.movimentacoes_sociedade m
USING ranked r
WHERE m.id = r.id AND r.rn > 1;

ALTER TABLE public.movimentacoes_sociedade ENABLE TRIGGER trg_bloquear_delete_movimentacao;