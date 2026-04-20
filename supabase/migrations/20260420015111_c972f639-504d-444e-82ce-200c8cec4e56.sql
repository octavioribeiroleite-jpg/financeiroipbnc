-- Função utilitária: mês está consolidado para a sociedade?
CREATE OR REPLACE FUNCTION public.mes_consolidado(_sociedade_id uuid, _data date)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.fechamentos_mensais
    WHERE sociedade_id = _sociedade_id
      AND ano = EXTRACT(YEAR FROM _data)::int
      AND mes = EXTRACT(MONTH FROM _data)::int
      AND status = 'consolidado'
  );
$$;

-- ============================================================
-- Trigger: bloquear contribuições em mês consolidado
-- ============================================================
CREATE OR REPLACE FUNCTION public.bloquear_contribuicao_mes_consolidado()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _ref date;
  _soc uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _ref := OLD.data_pagamento;
    _soc := OLD.sociedade_id;
  ELSE
    _ref := NEW.data_pagamento;
    _soc := NEW.sociedade_id;
  END IF;

  IF public.mes_consolidado(_soc, _ref) THEN
    RAISE EXCEPTION 'O mês % já está consolidado e não aceita alterações em contribuições.',
      to_char(_ref, 'MM/YYYY');
  END IF;

  -- Se for UPDATE e a data antiga estava em mês consolidado, também bloqueia
  IF TG_OP = 'UPDATE' AND public.mes_consolidado(OLD.sociedade_id, OLD.data_pagamento) THEN
    RAISE EXCEPTION 'A contribuição original pertence a um mês consolidado (%) e não pode ser alterada.',
      to_char(OLD.data_pagamento, 'MM/YYYY');
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bloq_contrib_mes ON public.contribuicoes;
CREATE TRIGGER trg_bloq_contrib_mes
BEFORE INSERT OR UPDATE OR DELETE ON public.contribuicoes
FOR EACH ROW EXECUTE FUNCTION public.bloquear_contribuicao_mes_consolidado();

-- ============================================================
-- Trigger: bloquear solicitações em mês consolidado
-- ============================================================
CREATE OR REPLACE FUNCTION public.bloquear_solicitacao_mes_consolidado()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _data_pag date;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF public.mes_consolidado(OLD.sociedade_id, OLD.vencimento) THEN
      RAISE EXCEPTION 'O mês % já está consolidado e não aceita exclusão de solicitações.',
        to_char(OLD.vencimento, 'MM/YYYY');
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF public.mes_consolidado(NEW.sociedade_id, NEW.vencimento) THEN
      RAISE EXCEPTION 'O mês % (vencimento) já está consolidado e não aceita novas solicitações.',
        to_char(NEW.vencimento, 'MM/YYYY');
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Marcar como paga: data de pagamento (ou hoje) não pode cair em mês consolidado
    IF NEW.status = 'paga' AND OLD.status IS DISTINCT FROM 'paga' THEN
      _data_pag := COALESCE(NEW.data_pagamento, CURRENT_DATE);
      IF public.mes_consolidado(NEW.sociedade_id, _data_pag) THEN
        RAISE EXCEPTION 'O mês % já está consolidado — não é possível registrar pagamento nesse período.',
          to_char(_data_pag, 'MM/YYYY');
      END IF;
    END IF;

    -- Mudança de vencimento para mês consolidado
    IF NEW.vencimento <> OLD.vencimento
       AND public.mes_consolidado(NEW.sociedade_id, NEW.vencimento) THEN
      RAISE EXCEPTION 'O novo vencimento (%) cai em um mês já consolidado.',
        to_char(NEW.vencimento, 'MM/YYYY');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bloq_solic_mes ON public.solicitacoes_pagamento;
CREATE TRIGGER trg_bloq_solic_mes
BEFORE INSERT OR UPDATE OR DELETE ON public.solicitacoes_pagamento
FOR EACH ROW EXECUTE FUNCTION public.bloquear_solicitacao_mes_consolidado();

-- ============================================================
-- Trigger: bloquear movimentações em mês consolidado
-- ============================================================
CREATE OR REPLACE FUNCTION public.bloquear_movimentacao_mes_consolidado()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _ref date;
  _soc uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _ref := OLD.data_movimento;
    _soc := OLD.sociedade_id;
  ELSE
    _ref := NEW.data_movimento;
    _soc := NEW.sociedade_id;
  END IF;

  IF public.mes_consolidado(_soc, _ref) THEN
    RAISE EXCEPTION 'O mês % já está consolidado e não aceita novas movimentações.',
      to_char(_ref, 'MM/YYYY');
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bloq_mov_mes ON public.movimentacoes_sociedade;
CREATE TRIGGER trg_bloq_mov_mes
BEFORE INSERT OR UPDATE OR DELETE ON public.movimentacoes_sociedade
FOR EACH ROW EXECUTE FUNCTION public.bloquear_movimentacao_mes_consolidado();

-- ============================================================
-- Trigger: bloquear edição de fechamento já consolidado
-- ============================================================
CREATE OR REPLACE FUNCTION public.bloquear_edicao_fechamento_consolidado()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status = 'consolidado' THEN
    RAISE EXCEPTION 'Este fechamento já está consolidado e não pode ser alterado.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bloq_fech_consolidado ON public.fechamentos_mensais;
CREATE TRIGGER trg_bloq_fech_consolidado
BEFORE UPDATE ON public.fechamentos_mensais
FOR EACH ROW EXECUTE FUNCTION public.bloquear_edicao_fechamento_consolidado();