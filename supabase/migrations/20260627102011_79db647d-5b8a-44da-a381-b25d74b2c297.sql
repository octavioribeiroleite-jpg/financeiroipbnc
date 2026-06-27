
-- 1. Ajusta o trigger de criação para inserir movimentação NÃO confirmada
CREATE OR REPLACE FUNCTION public.gerar_movimentacao_contribuicao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.movimentacoes_sociedade
    (sociedade_id, tipo, origem, referencia_id, valor, data_movimento, observacao, criado_por, confirmada)
  VALUES
    (NEW.sociedade_id, 'entrada', 'contribuicao', NEW.id, NEW.valor, NEW.data_pagamento,
     'Contribuição de ' || NEW.membro_nome, NEW.criado_por,
     (NEW.status_conferencia = 'conferida'));
  RETURN NEW;
END;
$function$;

-- 2. Nova função: sincroniza confirmação da movimentação com o status de conferência
CREATE OR REPLACE FUNCTION public.sincronizar_confirmacao_contribuicao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status_conferencia IS DISTINCT FROM OLD.status_conferencia
     OR NEW.valor IS DISTINCT FROM OLD.valor
     OR NEW.data_pagamento IS DISTINCT FROM OLD.data_pagamento
     OR NEW.membro_nome IS DISTINCT FROM OLD.membro_nome THEN
    UPDATE public.movimentacoes_sociedade
       SET confirmada = (NEW.status_conferencia = 'conferida'),
           valor = NEW.valor,
           data_movimento = NEW.data_pagamento,
           observacao = 'Contribuição de ' || NEW.membro_nome
     WHERE origem = 'contribuicao'
       AND referencia_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sincronizar_confirmacao_contribuicao ON public.contribuicoes;
CREATE TRIGGER trg_sincronizar_confirmacao_contribuicao
AFTER UPDATE ON public.contribuicoes
FOR EACH ROW
EXECUTE FUNCTION public.sincronizar_confirmacao_contribuicao();

-- 3. Reconcilia dados existentes: movimentações de contribuições pendentes/divergentes ficam não confirmadas
UPDATE public.movimentacoes_sociedade m
   SET confirmada = (c.status_conferencia = 'conferida')
  FROM public.contribuicoes c
 WHERE m.origem = 'contribuicao'
   AND m.referencia_id = c.id
   AND m.confirmada <> (c.status_conferencia = 'conferida');
