-- Lancamentos de teste para junho/2026 em todas as sociedades ativas.
-- Pode rodar novamente: antes de inserir, remove os testes anteriores com o mesmo marcador.
--
-- Resultado esperado:
-- - 2 entradas conferidas por sociedade: entram no saldo apos a migration de conferencia.
-- - 1 entrada pendente por sociedade: aparece na lista, mas nao entra no saldo.

DO $$
DECLARE
  _usuario_id uuid;
BEGIN
  SELECT u.id
  INTO _usuario_id
  FROM public.usuarios u
  LEFT JOIN public.papeis_usuario p ON p.usuario_id = u.id
  WHERE u.ativo = true
  ORDER BY
    CASE p.papel
      WHEN 'administrador' THEN 1
      WHEN 'tesoureiro_igreja' THEN 2
      WHEN 'tesoureiro_central' THEN 3
      WHEN 'tesoureiro_sociedade' THEN 4
      ELSE 5
    END,
    u.data_criacao
  LIMIT 1;

  IF _usuario_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuario ativo encontrado para criar os lancamentos de teste.';
  END IF;

  DELETE FROM public.contribuicoes
  WHERE observacao LIKE '[TESTE JUNHO 2026]%';

  INSERT INTO public.contribuicoes (
    sociedade_id,
    membro_nome,
    referencia_mes,
    valor,
    data_pagamento,
    forma_pagamento,
    comprovante_url,
    observacao,
    criado_por,
    status_conferencia,
    conferido_por,
    data_conferencia
  )
  SELECT
    s.id,
    'Teste ' || s.nome || ' - oferta especial',
    DATE '2026-06-01',
    125.00,
    DATE '2026-06-05',
    'PIX',
    NULL,
    '[TESTE JUNHO 2026] Entrada conferida 1',
    _usuario_id,
    'conferida'::public.status_conferencia,
    _usuario_id,
    now()
  FROM public.sociedades s
  WHERE s.status = 'ativa';

  INSERT INTO public.contribuicoes (
    sociedade_id,
    membro_nome,
    referencia_mes,
    valor,
    data_pagamento,
    forma_pagamento,
    comprovante_url,
    observacao,
    criado_por,
    status_conferencia,
    conferido_por,
    data_conferencia
  )
  SELECT
    s.id,
    'Teste ' || s.nome || ' - contribuicao mensal',
    DATE '2026-06-01',
    75.50,
    DATE '2026-06-14',
    'Dinheiro',
    NULL,
    '[TESTE JUNHO 2026] Entrada conferida 2',
    _usuario_id,
    'conferida'::public.status_conferencia,
    _usuario_id,
    now()
  FROM public.sociedades s
  WHERE s.status = 'ativa';

  INSERT INTO public.contribuicoes (
    sociedade_id,
    membro_nome,
    referencia_mes,
    valor,
    data_pagamento,
    forma_pagamento,
    comprovante_url,
    observacao,
    criado_por,
    status_conferencia
  )
  SELECT
    s.id,
    'Teste ' || s.nome || ' - aguardando conferencia',
    DATE '2026-06-01',
    42.25,
    DATE '2026-06-22',
    'PIX',
    NULL,
    '[TESTE JUNHO 2026] Entrada pendente',
    _usuario_id,
    'pendente'::public.status_conferencia
  FROM public.sociedades s
  WHERE s.status = 'ativa';
END;
$$;
