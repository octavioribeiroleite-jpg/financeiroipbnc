CREATE OR REPLACE FUNCTION public.reabrir_fechamento_consolidado(
  _fechamento_id uuid,
  _motivo text
)
RETURNS public.fechamentos_mensais
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _admin_nome text;
  _antigo public.fechamentos_mensais;
  _novo public.fechamentos_mensais;
  _nova_obs text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado.';
  END IF;

  IF NOT public.has_role(_uid, 'administrador') THEN
    RAISE EXCEPTION 'Apenas administradores podem reabrir um mês consolidado.';
  END IF;

  IF _motivo IS NULL OR length(btrim(_motivo)) < 5 THEN
    RAISE EXCEPTION 'Informe um motivo com pelo menos 5 caracteres.';
  END IF;

  SELECT * INTO _antigo FROM public.fechamentos_mensais WHERE id = _fechamento_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fechamento não encontrado.';
  END IF;

  IF _antigo.status <> 'consolidado' THEN
    RAISE EXCEPTION 'Apenas fechamentos consolidados podem ser reabertos.';
  END IF;

  SELECT nome INTO _admin_nome FROM public.usuarios WHERE id = _uid;

  _nova_obs := format(
    '[Reaberto em %s por %s] %s%s',
    to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI'),
    COALESCE(_admin_nome, 'admin'),
    btrim(_motivo),
    CASE WHEN _antigo.observacao IS NOT NULL AND length(_antigo.observacao) > 0
         THEN E'\n---\n' || _antigo.observacao
         ELSE '' END
  );

  -- Bypass do trigger que bloqueia edição de consolidado
  ALTER TABLE public.fechamentos_mensais DISABLE TRIGGER trg_bloq_fech_consolidado;

  UPDATE public.fechamentos_mensais
  SET status = 'conferido',
      observacao = _nova_obs
  WHERE id = _fechamento_id
  RETURNING * INTO _novo;

  ALTER TABLE public.fechamentos_mensais ENABLE TRIGGER trg_bloq_fech_consolidado;

  -- Auditoria explícita do evento de reabertura
  INSERT INTO public.auditoria (usuario_id, acao, modulo, registro_id, detalhes)
  VALUES (
    _uid,
    'reabertura_consolidado',
    'fechamentos_mensais',
    _fechamento_id,
    jsonb_build_object(
      'motivo', btrim(_motivo),
      'admin_nome', _admin_nome,
      'estado_anterior', to_jsonb(_antigo)
    )
  );

  RETURN _novo;
EXCEPTION WHEN OTHERS THEN
  -- Garante reabilitação do trigger mesmo em erro
  BEGIN
    ALTER TABLE public.fechamentos_mensais ENABLE TRIGGER trg_bloq_fech_consolidado;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.reabrir_fechamento_consolidado(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reabrir_fechamento_consolidado(uuid, text) TO authenticated;