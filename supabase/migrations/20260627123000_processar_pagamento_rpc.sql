-- Centraliza o processamento de uma solicitação em uma única transação.
-- O popup pode aprovar, devolver, recusar ou aprovar e pagar sem expor
-- as etapas técnicas intermediárias ao usuário.

CREATE OR REPLACE FUNCTION public.processar_solicitacao_pagamento(
  _solicitacao_id uuid,
  _acao text,
  _motivo text DEFAULT NULL,
  _data_pagamento date DEFAULT NULL,
  _comprovante_url text DEFAULT NULL,
  _observacoes text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  sociedade_id uuid,
  status public.status_solicitacao
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_registro public.solicitacoes_pagamento%ROWTYPE;
  v_usuario uuid := auth.uid();
  v_observacoes text;
BEGIN
  IF v_usuario IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.papeis_usuario p
    WHERE p.usuario_id = v_usuario
      AND p.papel IN ('administrador'::public.app_role, 'tesoureiro_central'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Usuário sem permissão para processar pagamentos.' USING ERRCODE = '42501';
  END IF;

  SELECT s.*
    INTO v_registro
  FROM public.solicitacoes_pagamento s
  WHERE s.id = _solicitacao_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada.' USING ERRCODE = 'P0002';
  END IF;

  IF _acao = 'aprovar' THEN
    IF v_registro.status NOT IN ('enviada', 'em_analise') THEN
      RAISE EXCEPTION 'Esta solicitação não está disponível para aprovação.' USING ERRCODE = 'check_violation';
    END IF;

    IF v_registro.status = 'enviada' THEN
      UPDATE public.solicitacoes_pagamento
      SET status = 'em_analise', conferido_por = v_usuario
      WHERE solicitacoes_pagamento.id = _solicitacao_id
      RETURNING * INTO v_registro;
    END IF;

    UPDATE public.solicitacoes_pagamento
    SET status = 'aprovada', conferido_por = v_usuario, motivo_recusa = NULL
    WHERE solicitacoes_pagamento.id = _solicitacao_id
    RETURNING * INTO v_registro;

  ELSIF _acao = 'devolver' THEN
    IF v_registro.status NOT IN ('enviada', 'em_analise') THEN
      RAISE EXCEPTION 'Esta solicitação não pode ser devolvida neste status.' USING ERRCODE = 'check_violation';
    END IF;

    IF NULLIF(BTRIM(_motivo), '') IS NULL THEN
      RAISE EXCEPTION 'Informe o ajuste necessário.' USING ERRCODE = 'not_null_violation';
    END IF;

    UPDATE public.solicitacoes_pagamento
    SET status = 'rascunho', motivo_recusa = BTRIM(_motivo), conferido_por = v_usuario
    WHERE solicitacoes_pagamento.id = _solicitacao_id
    RETURNING * INTO v_registro;

  ELSIF _acao = 'recusar' THEN
    IF v_registro.status NOT IN ('enviada', 'em_analise') THEN
      RAISE EXCEPTION 'Esta solicitação não pode ser recusada neste status.' USING ERRCODE = 'check_violation';
    END IF;

    IF NULLIF(BTRIM(_motivo), '') IS NULL THEN
      RAISE EXCEPTION 'Informe o motivo da recusa.' USING ERRCODE = 'not_null_violation';
    END IF;

    IF v_registro.status = 'enviada' THEN
      UPDATE public.solicitacoes_pagamento
      SET status = 'em_analise', conferido_por = v_usuario
      WHERE solicitacoes_pagamento.id = _solicitacao_id
      RETURNING * INTO v_registro;
    END IF;

    UPDATE public.solicitacoes_pagamento
    SET status = 'recusada', motivo_recusa = BTRIM(_motivo), conferido_por = v_usuario
    WHERE solicitacoes_pagamento.id = _solicitacao_id
    RETURNING * INTO v_registro;

  ELSIF _acao IN ('aprovar_pagar', 'pagar') THEN
    IF _acao = 'aprovar_pagar' AND v_registro.status NOT IN ('enviada', 'em_analise') THEN
      RAISE EXCEPTION 'Esta solicitação não está disponível para aprovação e pagamento.' USING ERRCODE = 'check_violation';
    END IF;

    IF _acao = 'pagar' AND v_registro.status <> 'aprovada' THEN
      RAISE EXCEPTION 'Somente solicitações aprovadas podem ser pagas.' USING ERRCODE = 'check_violation';
    END IF;

    IF _data_pagamento IS NULL OR NULLIF(BTRIM(_comprovante_url), '') IS NULL THEN
      RAISE EXCEPTION 'Informe a data e o comprovante do pagamento.' USING ERRCODE = 'not_null_violation';
    END IF;

    IF _data_pagamento > CURRENT_DATE THEN
      RAISE EXCEPTION 'A data do pagamento não pode estar no futuro.' USING ERRCODE = 'check_violation';
    END IF;

    IF public.mes_consolidado(v_registro.sociedade_id, _data_pagamento) THEN
      RAISE EXCEPTION 'O mês do pagamento já está consolidado.' USING ERRCODE = 'check_violation';
    END IF;

    IF _acao = 'aprovar_pagar' THEN
      IF v_registro.status = 'enviada' THEN
        UPDATE public.solicitacoes_pagamento
        SET status = 'em_analise', conferido_por = v_usuario
        WHERE solicitacoes_pagamento.id = _solicitacao_id
        RETURNING * INTO v_registro;
      END IF;

      UPDATE public.solicitacoes_pagamento
      SET status = 'aprovada', conferido_por = v_usuario, motivo_recusa = NULL
      WHERE solicitacoes_pagamento.id = _solicitacao_id
      RETURNING * INTO v_registro;
    END IF;

    v_observacoes := CASE
      WHEN NULLIF(BTRIM(_observacoes), '') IS NULL THEN v_registro.observacoes
      ELSE CONCAT_WS(E'\n— ', NULLIF(v_registro.observacoes, ''), BTRIM(_observacoes))
    END;

    UPDATE public.solicitacoes_pagamento
    SET
      status = 'paga',
      data_pagamento = _data_pagamento,
      anexo_comprovante_url = BTRIM(_comprovante_url),
      pago_por = v_usuario,
      conferido_por = COALESCE(conferido_por, v_usuario),
      observacoes = v_observacoes
    WHERE solicitacoes_pagamento.id = _solicitacao_id
    RETURNING * INTO v_registro;

  ELSE
    RAISE EXCEPTION 'Ação de processamento inválida.' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT v_registro.id, v_registro.sociedade_id, v_registro.status;
END;
$$;

REVOKE ALL ON FUNCTION public.processar_solicitacao_pagamento(uuid, text, text, date, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.processar_solicitacao_pagamento(uuid, text, text, date, text, text) TO authenticated;
