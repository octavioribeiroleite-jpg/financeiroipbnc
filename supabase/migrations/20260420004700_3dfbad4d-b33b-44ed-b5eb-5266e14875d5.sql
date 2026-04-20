
-- ============================================================
-- Triggers de negócio (funções já existentes na base de dados)
-- ============================================================

-- Contribuição -> movimentação de entrada
DROP TRIGGER IF EXISTS trg_contribuicao_movimentacao ON public.contribuicoes;
CREATE TRIGGER trg_contribuicao_movimentacao
AFTER INSERT ON public.contribuicoes
FOR EACH ROW
EXECUTE FUNCTION public.gerar_movimentacao_contribuicao();

-- Solicitação paga -> movimentação de saída + atualiza data_atualizacao
DROP TRIGGER IF EXISTS trg_solicitacao_pagamento ON public.solicitacoes_pagamento;
CREATE TRIGGER trg_solicitacao_pagamento
BEFORE UPDATE ON public.solicitacoes_pagamento
FOR EACH ROW
EXECUTE FUNCTION public.gerar_movimentacao_pagamento();

-- Bloqueio: movimentações confirmadas não podem ser excluídas
DROP TRIGGER IF EXISTS trg_bloquear_excl_movimentacao ON public.movimentacoes_sociedade;
CREATE TRIGGER trg_bloquear_excl_movimentacao
BEFORE DELETE ON public.movimentacoes_sociedade
FOR EACH ROW
EXECUTE FUNCTION public.bloquear_exclusao_movimentacao();

-- Bloqueio: solicitações pagas não podem ser excluídas
DROP TRIGGER IF EXISTS trg_bloquear_excl_pagamento ON public.solicitacoes_pagamento;
CREATE TRIGGER trg_bloquear_excl_pagamento
BEFORE DELETE ON public.solicitacoes_pagamento
FOR EACH ROW
EXECUTE FUNCTION public.bloquear_exclusao_pagamento_pago();

-- Auditoria nas tabelas operacionais
DROP TRIGGER IF EXISTS trg_aud_contribuicoes ON public.contribuicoes;
CREATE TRIGGER trg_aud_contribuicoes
AFTER INSERT OR UPDATE OR DELETE ON public.contribuicoes
FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();

DROP TRIGGER IF EXISTS trg_aud_solicitacoes ON public.solicitacoes_pagamento;
CREATE TRIGGER trg_aud_solicitacoes
AFTER INSERT OR UPDATE OR DELETE ON public.solicitacoes_pagamento
FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();

-- ============================================================
-- Políticas de Storage para o bucket "anexos"
-- Caminho esperado: {sociedade_id}/{tipo}/{arquivo}
-- ============================================================

-- Limpeza idempotente
DROP POLICY IF EXISTS "Sociedade lê seus anexos" ON storage.objects;
DROP POLICY IF EXISTS "Sociedade envia seus anexos" ON storage.objects;
DROP POLICY IF EXISTS "Sociedade remove seus anexos" ON storage.objects;
DROP POLICY IF EXISTS "Gestão lê todos os anexos" ON storage.objects;
DROP POLICY IF EXISTS "Central envia anexos" ON storage.objects;

-- Tesoureiro da sociedade lê arquivos da própria sociedade
CREATE POLICY "Sociedade lê seus anexos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'anexos'
  AND (storage.foldername(name))[1] = public.get_user_sociedade(auth.uid())::text
  AND public.has_role(auth.uid(), 'tesoureiro_sociedade')
);

-- Tesoureiro da sociedade envia arquivos para a pasta da própria sociedade
CREATE POLICY "Sociedade envia seus anexos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'anexos'
  AND (storage.foldername(name))[1] = public.get_user_sociedade(auth.uid())::text
  AND public.has_role(auth.uid(), 'tesoureiro_sociedade')
);

-- Tesoureiro da sociedade remove arquivos da própria sociedade
CREATE POLICY "Sociedade remove seus anexos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'anexos'
  AND (storage.foldername(name))[1] = public.get_user_sociedade(auth.uid())::text
  AND public.has_role(auth.uid(), 'tesoureiro_sociedade')
);

-- Gestão (admin, central, igreja) lê todos os anexos
CREATE POLICY "Gestão lê todos os anexos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'anexos'
  AND public.is_gestao(auth.uid())
);

-- Central pode anexar comprovantes em qualquer pasta de sociedade
CREATE POLICY "Central envia anexos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'anexos'
  AND (
    public.has_role(auth.uid(), 'tesoureiro_central')
    OR public.has_role(auth.uid(), 'administrador')
  )
);
