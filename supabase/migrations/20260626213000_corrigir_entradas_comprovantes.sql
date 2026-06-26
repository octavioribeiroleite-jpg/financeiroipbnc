-- Mantem a movimentacao financeira sincronizada quando uma entrada e criada,
-- corrigida ou removida.
CREATE OR REPLACE FUNCTION public.sincronizar_movimentacao_contribuicao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _linhas int;
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.movimentacoes_sociedade
    SET
      confirmada = false,
      observacao = 'Entrada removida: ' || OLD.membro_nome
    WHERE origem = 'contribuicao'
      AND referencia_id = OLD.id;

    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    UPDATE public.movimentacoes_sociedade
    SET
      sociedade_id = NEW.sociedade_id,
      tipo = 'entrada',
      valor = NEW.valor,
      data_movimento = NEW.data_pagamento,
      observacao = 'Entrada: ' || NEW.membro_nome,
      criado_por = NEW.criado_por,
      confirmada = true
    WHERE origem = 'contribuicao'
      AND referencia_id = NEW.id;

    GET DIAGNOSTICS _linhas = ROW_COUNT;

    IF _linhas > 0 THEN
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO public.movimentacoes_sociedade
    (sociedade_id, tipo, origem, referencia_id, valor, data_movimento, observacao, criado_por, confirmada)
  VALUES
    (NEW.sociedade_id, 'entrada', 'contribuicao', NEW.id, NEW.valor, NEW.data_pagamento,
     'Entrada: ' || NEW.membro_nome, NEW.criado_por, true);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contribuicao_movimentacao ON public.contribuicoes;
CREATE TRIGGER trg_contribuicao_movimentacao
AFTER INSERT OR UPDATE OR DELETE ON public.contribuicoes
FOR EACH ROW EXECUTE FUNCTION public.sincronizar_movimentacao_contribuicao();

-- Permite que perfis de gestao substituam/removam comprovantes no bucket privado.
DROP POLICY IF EXISTS "Gestao remove anexos" ON storage.objects;
CREATE POLICY "Gestao remove anexos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'anexos'
  AND public.is_gestao(auth.uid())
);
