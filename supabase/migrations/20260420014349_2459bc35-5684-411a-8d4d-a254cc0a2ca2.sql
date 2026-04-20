-- 1) Unicidade por sociedade/ano/mês
CREATE UNIQUE INDEX IF NOT EXISTS ux_fechamentos_soc_ano_mes
  ON public.fechamentos_mensais (sociedade_id, ano, mes);

-- 2) Trigger de cálculo automático de saldo final
CREATE OR REPLACE FUNCTION public.calcular_saldo_fechamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.saldo_final := COALESCE(NEW.saldo_inicial, 0)
                   + COALESCE(NEW.total_entradas, 0)
                   - COALESCE(NEW.total_saidas, 0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calc_saldo_fechamento ON public.fechamentos_mensais;
CREATE TRIGGER trg_calc_saldo_fechamento
  BEFORE INSERT OR UPDATE ON public.fechamentos_mensais
  FOR EACH ROW EXECUTE FUNCTION public.calcular_saldo_fechamento();

-- 3) Auditoria automática
DROP TRIGGER IF EXISTS trg_aud_fechamentos ON public.fechamentos_mensais;
CREATE TRIGGER trg_aud_fechamentos
  AFTER INSERT OR UPDATE OR DELETE ON public.fechamentos_mensais
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();

-- 4) Permitir admin excluir fechamento (uso excepcional)
DROP POLICY IF EXISTS "Admin exclui fechamento" ON public.fechamentos_mensais;
CREATE POLICY "Admin exclui fechamento"
  ON public.fechamentos_mensais
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'administrador'::app_role));