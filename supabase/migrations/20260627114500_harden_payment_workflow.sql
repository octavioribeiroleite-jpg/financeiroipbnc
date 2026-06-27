-- Protege o fluxo de solicitações de pagamento e garante que uma quitação
-- gere exatamente uma saída confirmada no cofrinho da sociedade.

-- Remove duplicidades históricas antes de criar a proteção de unicidade.
DELETE FROM public.movimentacoes_sociedade a
USING public.movimentacoes_sociedade b
WHERE a.origem = 'solicitacao_pagamento'
  AND b.origem = 'solicitacao_pagamento'
  AND a.referencia_id IS NOT NULL
  AND a.referencia_id = b.referencia_id
  AND (a.data_criacao, a.id) > (b.data_criacao, b.id);

CREATE UNIQUE INDEX IF NOT EXISTS movimentacoes_solicitacao_pagamento_unica
  ON public.movimentacoes_sociedade (referencia_id)
  WHERE origem = 'solicitacao_pagamento' AND referencia_id IS NOT NULL;

-- Corrige solicitações já pagas que ainda não tenham reflexo financeiro no extrato.
INSERT INTO public.movimentacoes_sociedade (
  sociedade_id,
  tipo,
  valor,
  data_movimento,
  origem,
  referencia_id,
  confirmada,
  criado_por,
  observacao
)
SELECT
  s.sociedade_id,
  'saida',
  s.valor,
  s.data_pagamento,
  'solicitacao_pagamento',
  s.id,
  true,
  s.pago_por,
  s.descricao
FROM public.solicitacoes_pagamento s
WHERE s.status = 'paga'
  AND s.data_pagamento IS NOT NULL
  AND s.pago_por IS NOT NULL
ON CONFLICT (referencia_id)
  WHERE origem = 'solicitacao_pagamento' AND referencia_id IS NOT NULL
DO UPDATE SET
  sociedade_id = EXCLUDED.sociedade_id,
  tipo = 'saida',
  valor = EXCLUDED.valor,
  data_movimento = EXCLUDED.data_movimento,
  confirmada = true,
  criado_por = EXCLUDED.criado_por,
  observacao = EXCLUDED.observacao;

CREATE OR REPLACE FUNCTION public.validar_fluxo_solicitacao_pagamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status NOT IN ('rascunho', 'enviada') THEN
    RAISE EXCEPTION 'Uma nova solicitação deve ser criada como rascunho ou enviada.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Dados financeiros ficam imutáveis depois que a solicitação sai do rascunho.
    IF OLD.status <> 'rascunho' AND (
      NEW.sociedade_id IS DISTINCT FROM OLD.sociedade_id OR
      NEW.fornecedor_id IS DISTINCT FROM OLD.fornecedor_id OR
      NEW.categoria_id IS DISTINCT FROM OLD.categoria_id OR
      NEW.descricao IS DISTINCT FROM OLD.descricao OR
      NEW.valor IS DISTINCT FROM OLD.valor OR
      NEW.vencimento IS DISTINCT FROM OLD.vencimento OR
      NEW.anexo_nota_url IS DISTINCT FROM OLD.anexo_nota_url OR
      NEW.criado_por IS DISTINCT FROM OLD.criado_por
    ) THEN
      RAISE EXCEPTION 'Os dados financeiros não podem ser alterados após o envio para processamento.'
        USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status AND NOT (
      (OLD.status = 'rascunho' AND NEW.status = 'enviada') OR
      (OLD.status = 'enviada' AND NEW.status IN ('rascunho', 'em_analise')) OR
      (OLD.status = 'em_analise' AND NEW.status IN ('rascunho', 'aprovada', 'recusada')) OR
      (OLD.status = 'aprovada' AND NEW.status = 'paga')
    ) THEN
      RAISE EXCEPTION 'Transição inválida de % para %.', OLD.status, NEW.status
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF NEW.status = 'paga' THEN
    IF NEW.data_pagamento IS NULL OR NEW.pago_por IS NULL OR NULLIF(BTRIM(NEW.anexo_comprovante_url), '') IS NULL THEN
      RAISE EXCEPTION 'Pagamento exige data, responsável e comprovante.'
        USING ERRCODE = 'not_null_violation';
    END IF;

    IF NEW.data_pagamento > CURRENT_DATE THEN
      RAISE EXCEPTION 'A data do pagamento não pode estar no futuro.'
        USING ERRCODE = 'check_violation';
    END IF;

    IF public.mes_consolidado(NEW.sociedade_id, NEW.data_pagamento) THEN
      RAISE EXCEPTION 'O mês do pagamento já está consolidado.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validar_fluxo_solicitacao_pagamento ON public.solicitacoes_pagamento;
CREATE TRIGGER validar_fluxo_solicitacao_pagamento
BEFORE INSERT OR UPDATE ON public.solicitacoes_pagamento
FOR EACH ROW
EXECUTE FUNCTION public.validar_fluxo_solicitacao_pagamento();

CREATE OR REPLACE FUNCTION public.sincronizar_saida_solicitacao_paga()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'paga' THEN
    INSERT INTO public.movimentacoes_sociedade (
      sociedade_id,
      tipo,
      valor,
      data_movimento,
      origem,
      referencia_id,
      confirmada,
      criado_por,
      observacao
    )
    VALUES (
      NEW.sociedade_id,
      'saida',
      NEW.valor,
      NEW.data_pagamento,
      'solicitacao_pagamento',
      NEW.id,
      true,
      NEW.pago_por,
      NEW.descricao
    )
    ON CONFLICT (referencia_id)
      WHERE origem = 'solicitacao_pagamento' AND referencia_id IS NOT NULL
    DO UPDATE SET
      sociedade_id = EXCLUDED.sociedade_id,
      tipo = 'saida',
      valor = EXCLUDED.valor,
      data_movimento = EXCLUDED.data_movimento,
      confirmada = true,
      criado_por = EXCLUDED.criado_por,
      observacao = EXCLUDED.observacao;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zz_sincronizar_saida_solicitacao_paga ON public.solicitacoes_pagamento;
CREATE TRIGGER zz_sincronizar_saida_solicitacao_paga
AFTER INSERT OR UPDATE OF status, data_pagamento, valor, sociedade_id, pago_por, descricao
ON public.solicitacoes_pagamento
FOR EACH ROW
EXECUTE FUNCTION public.sincronizar_saida_solicitacao_paga();
