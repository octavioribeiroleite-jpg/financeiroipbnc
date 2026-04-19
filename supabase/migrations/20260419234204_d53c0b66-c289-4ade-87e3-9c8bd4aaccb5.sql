CREATE OR REPLACE FUNCTION public.bloquear_exclusao_movimentacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.confirmada = true THEN
    RAISE EXCEPTION 'Movimentações confirmadas não podem ser excluídas. Utilize um lançamento de ajuste.';
  END IF;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.bloquear_exclusao_pagamento_pago()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'paga' THEN
    RAISE EXCEPTION 'Solicitações pagas não podem ser excluídas.';
  END IF;
  RETURN OLD;
END;
$$;