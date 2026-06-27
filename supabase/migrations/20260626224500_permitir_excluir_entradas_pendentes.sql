-- Permite que o tesoureiro da sociedade remova uma entrada propria
-- enquanto ela ainda esta pendente de conferencia.
DROP POLICY IF EXISTS "Sociedade exclui contribuicoes proprias pendentes" ON public.contribuicoes;
CREATE POLICY "Sociedade exclui contribuicoes proprias pendentes"
ON public.contribuicoes
FOR DELETE
TO authenticated
USING (
  sociedade_id = public.get_user_sociedade(auth.uid())
  AND status_conferencia = 'pendente'
  AND public.has_role(auth.uid(), 'tesoureiro_sociedade')
);
