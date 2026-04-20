CREATE POLICY "Administrador gerencia contribuições" ON public.contribuicoes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'administrador')) WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Administrador gerencia solicitações" ON public.solicitacoes_pagamento FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'administrador')) WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Administrador cria fechamento" ON public.fechamentos_mensais FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Administrador edita fechamento" ON public.fechamentos_mensais FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'administrador')) WITH CHECK (public.has_role(auth.uid(), 'administrador'));