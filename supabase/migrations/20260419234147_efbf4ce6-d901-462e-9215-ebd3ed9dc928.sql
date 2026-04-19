-- ============= ENUMS =============
CREATE TYPE public.app_role AS ENUM ('administrador', 'tesoureiro_igreja', 'tesoureiro_central', 'tesoureiro_sociedade');
CREATE TYPE public.status_solicitacao AS ENUM ('rascunho', 'enviada', 'em_analise', 'aprovada', 'recusada', 'paga');
CREATE TYPE public.status_fechamento AS ENUM ('aberto', 'enviado', 'conferido', 'consolidado');
CREATE TYPE public.status_conferencia AS ENUM ('pendente', 'conferida', 'divergente');
CREATE TYPE public.tipo_movimento AS ENUM ('entrada', 'saida', 'ajuste');
CREATE TYPE public.tipo_categoria AS ENUM ('entrada', 'saida');
CREATE TYPE public.status_sociedade AS ENUM ('ativa', 'inativa');

-- ============= TABELAS BASE =============
CREATE TABLE public.sociedades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL,
  status public.status_sociedade NOT NULL DEFAULT 'ativa',
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  sociedade_id UUID REFERENCES public.sociedades(id) ON DELETE RESTRICT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.papeis_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  papel public.app_role NOT NULL,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, papel)
);

CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo public.tipo_categoria NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (nome, tipo)
);

CREATE TABLE public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_fantasia TEXT NOT NULL,
  razao_social TEXT,
  cnpj TEXT UNIQUE,
  chave_pix TEXT,
  banco TEXT,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============= TABELAS OPERACIONAIS =============
CREATE TABLE public.contribuicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sociedade_id UUID NOT NULL REFERENCES public.sociedades(id) ON DELETE RESTRICT,
  membro_nome TEXT NOT NULL,
  referencia_mes DATE NOT NULL,
  valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  data_pagamento DATE NOT NULL,
  forma_pagamento TEXT NOT NULL,
  comprovante_url TEXT,
  observacao TEXT,
  criado_por UUID NOT NULL REFERENCES public.usuarios(id),
  status_conferencia public.status_conferencia NOT NULL DEFAULT 'pendente',
  conferido_por UUID REFERENCES public.usuarios(id),
  data_conferencia TIMESTAMPTZ,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.solicitacoes_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sociedade_id UUID NOT NULL REFERENCES public.sociedades(id) ON DELETE RESTRICT,
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE RESTRICT,
  descricao TEXT NOT NULL,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  vencimento DATE NOT NULL,
  observacoes TEXT,
  anexo_nota_url TEXT,
  anexo_comprovante_url TEXT,
  status public.status_solicitacao NOT NULL DEFAULT 'rascunho',
  criado_por UUID NOT NULL REFERENCES public.usuarios(id),
  conferido_por UUID REFERENCES public.usuarios(id),
  pago_por UUID REFERENCES public.usuarios(id),
  data_pagamento DATE,
  motivo_recusa TEXT,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============= TABELAS CONSOLIDADORAS =============
CREATE TABLE public.movimentacoes_sociedade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sociedade_id UUID NOT NULL REFERENCES public.sociedades(id) ON DELETE RESTRICT,
  tipo public.tipo_movimento NOT NULL,
  origem TEXT NOT NULL, -- 'contribuicao' | 'solicitacao_pagamento' | 'ajuste'
  referencia_id UUID,
  valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  data_movimento DATE NOT NULL,
  observacao TEXT,
  criado_por UUID NOT NULL REFERENCES public.usuarios(id),
  confirmada BOOLEAN NOT NULL DEFAULT true,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.fechamentos_mensais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sociedade_id UUID NOT NULL REFERENCES public.sociedades(id) ON DELETE RESTRICT,
  mes INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano INT NOT NULL CHECK (ano BETWEEN 2000 AND 2100),
  saldo_inicial NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_entradas NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_saidas NUMERIC(12,2) NOT NULL DEFAULT 0,
  saldo_final NUMERIC(12,2) NOT NULL DEFAULT 0,
  enviado_por UUID REFERENCES public.usuarios(id),
  conferido_por UUID REFERENCES public.usuarios(id),
  status public.status_fechamento NOT NULL DEFAULT 'aberto',
  data_envio TIMESTAMPTZ,
  data_conferencia TIMESTAMPTZ,
  observacao TEXT,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sociedade_id, mes, ano)
);

CREATE TABLE public.auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.usuarios(id),
  acao TEXT NOT NULL,
  modulo TEXT NOT NULL,
  registro_id UUID,
  data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  detalhes JSONB
);

-- ============= ÍNDICES =============
CREATE INDEX idx_usuarios_sociedade ON public.usuarios(sociedade_id);
CREATE INDEX idx_papeis_usuario ON public.papeis_usuario(usuario_id);
CREATE INDEX idx_contribuicoes_sociedade ON public.contribuicoes(sociedade_id);
CREATE INDEX idx_contribuicoes_ref ON public.contribuicoes(referencia_mes);
CREATE INDEX idx_solicitacoes_sociedade ON public.solicitacoes_pagamento(sociedade_id);
CREATE INDEX idx_solicitacoes_status ON public.solicitacoes_pagamento(status);
CREATE INDEX idx_movimentacoes_sociedade ON public.movimentacoes_sociedade(sociedade_id);
CREATE INDEX idx_movimentacoes_data ON public.movimentacoes_sociedade(data_movimento);
CREATE INDEX idx_fechamentos_sociedade ON public.fechamentos_mensais(sociedade_id);
CREATE INDEX idx_auditoria_usuario ON public.auditoria(usuario_id);
CREATE INDEX idx_auditoria_modulo ON public.auditoria(modulo);

-- ============= FUNÇÕES DE SEGURANÇA =============
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.papeis_usuario
    WHERE usuario_id = _user_id AND papel = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_sociedade(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sociedade_id FROM public.usuarios WHERE id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.is_gestao(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'administrador')
      OR public.has_role(_user_id, 'tesoureiro_igreja')
      OR public.has_role(_user_id, 'tesoureiro_central')
$$;

-- ============= FUNÇÃO DE AUDITORIA =============
CREATE OR REPLACE FUNCTION public.registrar_auditoria()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _acao TEXT;
  _registro_id UUID;
  _detalhes JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _acao := 'criacao';
    _registro_id := NEW.id;
    _detalhes := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    _acao := 'edicao';
    _registro_id := NEW.id;
    _detalhes := jsonb_build_object('antes', to_jsonb(OLD), 'depois', to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    _acao := 'exclusao';
    _registro_id := OLD.id;
    _detalhes := to_jsonb(OLD);
  END IF;

  INSERT INTO public.auditoria (usuario_id, acao, modulo, registro_id, detalhes)
  VALUES (auth.uid(), _acao, TG_TABLE_NAME, _registro_id, _detalhes);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- ============= TRIGGER: GERAR MOVIMENTAÇÃO DE CONTRIBUIÇÃO =============
CREATE OR REPLACE FUNCTION public.gerar_movimentacao_contribuicao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.movimentacoes_sociedade
    (sociedade_id, tipo, origem, referencia_id, valor, data_movimento, observacao, criado_por, confirmada)
  VALUES
    (NEW.sociedade_id, 'entrada', 'contribuicao', NEW.id, NEW.valor, NEW.data_pagamento,
     'Contribuição de ' || NEW.membro_nome, NEW.criado_por, true);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_contribuicao_movimentacao
AFTER INSERT ON public.contribuicoes
FOR EACH ROW EXECUTE FUNCTION public.gerar_movimentacao_contribuicao();

-- ============= TRIGGER: GERAR MOVIMENTAÇÃO DE PAGAMENTO =============
CREATE OR REPLACE FUNCTION public.gerar_movimentacao_pagamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'paga' AND (OLD.status IS DISTINCT FROM 'paga') THEN
    INSERT INTO public.movimentacoes_sociedade
      (sociedade_id, tipo, origem, referencia_id, valor, data_movimento, observacao, criado_por, confirmada)
    VALUES
      (NEW.sociedade_id, 'saida', 'solicitacao_pagamento', NEW.id, NEW.valor,
       COALESCE(NEW.data_pagamento, CURRENT_DATE),
       'Pagamento: ' || NEW.descricao, COALESCE(NEW.pago_por, NEW.criado_por), true);
  END IF;
  NEW.data_atualizacao := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pagamento_movimentacao
BEFORE UPDATE ON public.solicitacoes_pagamento
FOR EACH ROW EXECUTE FUNCTION public.gerar_movimentacao_pagamento();

-- ============= TRIGGER: BLOQUEIO DE EXCLUSÃO =============
CREATE OR REPLACE FUNCTION public.bloquear_exclusao_movimentacao()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.confirmada = true THEN
    RAISE EXCEPTION 'Movimentações confirmadas não podem ser excluídas. Utilize um lançamento de ajuste.';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_bloquear_delete_movimentacao
BEFORE DELETE ON public.movimentacoes_sociedade
FOR EACH ROW EXECUTE FUNCTION public.bloquear_exclusao_movimentacao();

CREATE OR REPLACE FUNCTION public.bloquear_exclusao_pagamento_pago()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'paga' THEN
    RAISE EXCEPTION 'Solicitações pagas não podem ser excluídas.';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_bloquear_delete_pagamento
BEFORE DELETE ON public.solicitacoes_pagamento
FOR EACH ROW EXECUTE FUNCTION public.bloquear_exclusao_pagamento_pago();

-- ============= TRIGGERS DE AUDITORIA =============
CREATE TRIGGER trg_aud_sociedades AFTER INSERT OR UPDATE OR DELETE ON public.sociedades
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();
CREATE TRIGGER trg_aud_usuarios AFTER INSERT OR UPDATE OR DELETE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();
CREATE TRIGGER trg_aud_papeis AFTER INSERT OR UPDATE OR DELETE ON public.papeis_usuario
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();
CREATE TRIGGER trg_aud_fornecedores AFTER INSERT OR UPDATE OR DELETE ON public.fornecedores
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();
CREATE TRIGGER trg_aud_contribuicoes AFTER INSERT OR UPDATE OR DELETE ON public.contribuicoes
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();
CREATE TRIGGER trg_aud_solicitacoes AFTER INSERT OR UPDATE OR DELETE ON public.solicitacoes_pagamento
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();
CREATE TRIGGER trg_aud_fechamentos AFTER INSERT OR UPDATE OR DELETE ON public.fechamentos_mensais
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();

-- ============= HABILITAR RLS =============
ALTER TABLE public.sociedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papeis_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribuicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_sociedade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fechamentos_mensais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

-- ============= POLÍTICAS RLS =============

-- SOCIEDADES
CREATE POLICY "Gestão vê todas as sociedades" ON public.sociedades
  FOR SELECT TO authenticated USING (public.is_gestao(auth.uid()));
CREATE POLICY "Tesoureiro de sociedade vê a própria" ON public.sociedades
  FOR SELECT TO authenticated USING (id = public.get_user_sociedade(auth.uid()));
CREATE POLICY "Admin gerencia sociedades" ON public.sociedades
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'))
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

-- USUARIOS
CREATE POLICY "Usuário vê o próprio perfil" ON public.usuarios
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Gestão vê todos os usuários" ON public.usuarios
  FOR SELECT TO authenticated USING (public.is_gestao(auth.uid()));
CREATE POLICY "Admin gerencia usuários" ON public.usuarios
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'))
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

-- PAPEIS
CREATE POLICY "Usuário vê os próprios papéis" ON public.papeis_usuario
  FOR SELECT TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "Admin gerencia papéis" ON public.papeis_usuario
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'))
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

-- CATEGORIAS
CREATE POLICY "Autenticados leem categorias" ON public.categorias
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gerencia categorias" ON public.categorias
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'))
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

-- FORNECEDORES
CREATE POLICY "Autenticados leem fornecedores" ON public.fornecedores
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin e central gerenciam fornecedores" ON public.fornecedores
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrador') OR public.has_role(auth.uid(), 'tesoureiro_central'))
  WITH CHECK (public.has_role(auth.uid(), 'administrador') OR public.has_role(auth.uid(), 'tesoureiro_central'));

-- CONTRIBUIÇÕES
CREATE POLICY "Sociedade vê suas contribuições" ON public.contribuicoes
  FOR SELECT TO authenticated
  USING (sociedade_id = public.get_user_sociedade(auth.uid()) OR public.is_gestao(auth.uid()));
CREATE POLICY "Sociedade insere contribuições" ON public.contribuicoes
  FOR INSERT TO authenticated
  WITH CHECK (
    sociedade_id = public.get_user_sociedade(auth.uid())
    AND public.has_role(auth.uid(), 'tesoureiro_sociedade')
    AND criado_por = auth.uid()
  );
CREATE POLICY "Sociedade edita contribuições próprias pendentes" ON public.contribuicoes
  FOR UPDATE TO authenticated
  USING (
    sociedade_id = public.get_user_sociedade(auth.uid())
    AND status_conferencia = 'pendente'
    AND public.has_role(auth.uid(), 'tesoureiro_sociedade')
  );
CREATE POLICY "Central confere contribuições" ON public.contribuicoes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'tesoureiro_central') OR public.has_role(auth.uid(), 'administrador'));

-- SOLICITAÇÕES DE PAGAMENTO
CREATE POLICY "Sociedade vê suas solicitações" ON public.solicitacoes_pagamento
  FOR SELECT TO authenticated
  USING (sociedade_id = public.get_user_sociedade(auth.uid()) OR public.is_gestao(auth.uid()));
CREATE POLICY "Sociedade cria solicitações" ON public.solicitacoes_pagamento
  FOR INSERT TO authenticated
  WITH CHECK (
    sociedade_id = public.get_user_sociedade(auth.uid())
    AND public.has_role(auth.uid(), 'tesoureiro_sociedade')
    AND criado_por = auth.uid()
  );
CREATE POLICY "Sociedade edita rascunhos" ON public.solicitacoes_pagamento
  FOR UPDATE TO authenticated
  USING (
    sociedade_id = public.get_user_sociedade(auth.uid())
    AND status IN ('rascunho', 'enviada')
    AND public.has_role(auth.uid(), 'tesoureiro_sociedade')
  );
CREATE POLICY "Central gerencia solicitações" ON public.solicitacoes_pagamento
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'tesoureiro_central') OR public.has_role(auth.uid(), 'administrador'));
CREATE POLICY "Sociedade exclui rascunhos" ON public.solicitacoes_pagamento
  FOR DELETE TO authenticated
  USING (
    sociedade_id = public.get_user_sociedade(auth.uid())
    AND status = 'rascunho'
    AND public.has_role(auth.uid(), 'tesoureiro_sociedade')
  );

-- MOVIMENTAÇÕES
CREATE POLICY "Sociedade vê suas movimentações" ON public.movimentacoes_sociedade
  FOR SELECT TO authenticated
  USING (sociedade_id = public.get_user_sociedade(auth.uid()) OR public.is_gestao(auth.uid()));
CREATE POLICY "Central insere ajustes" ON public.movimentacoes_sociedade
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'tesoureiro_central') OR public.has_role(auth.uid(), 'administrador')
  );
-- Sem políticas de UPDATE/DELETE: imutável (DELETE também bloqueado por trigger)

-- FECHAMENTOS
CREATE POLICY "Sociedade vê seus fechamentos" ON public.fechamentos_mensais
  FOR SELECT TO authenticated
  USING (sociedade_id = public.get_user_sociedade(auth.uid()) OR public.is_gestao(auth.uid()));
CREATE POLICY "Sociedade cria fechamento" ON public.fechamentos_mensais
  FOR INSERT TO authenticated
  WITH CHECK (
    sociedade_id = public.get_user_sociedade(auth.uid())
    AND public.has_role(auth.uid(), 'tesoureiro_sociedade')
  );
CREATE POLICY "Sociedade edita fechamento aberto" ON public.fechamentos_mensais
  FOR UPDATE TO authenticated
  USING (
    sociedade_id = public.get_user_sociedade(auth.uid())
    AND status IN ('aberto', 'enviado')
    AND public.has_role(auth.uid(), 'tesoureiro_sociedade')
  );
CREATE POLICY "Central confere fechamento" ON public.fechamentos_mensais
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'tesoureiro_central') OR public.has_role(auth.uid(), 'administrador'));

-- AUDITORIA
CREATE POLICY "Admin e igreja leem auditoria" ON public.auditoria
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'administrador') OR public.has_role(auth.uid(), 'tesoureiro_igreja'));

-- ============= STORAGE: BUCKET PARA ANEXOS =============
INSERT INTO storage.buckets (id, name, public) VALUES ('anexos', 'anexos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Autenticados leem anexos da própria sociedade ou gestão"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'anexos' AND (
    public.is_gestao(auth.uid())
    OR (storage.foldername(name))[1] = public.get_user_sociedade(auth.uid())::text
  )
);

CREATE POLICY "Sociedade envia anexos na sua pasta"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'anexos'
  AND (storage.foldername(name))[1] = public.get_user_sociedade(auth.uid())::text
);

CREATE POLICY "Central envia anexos em qualquer pasta"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'anexos'
  AND (public.has_role(auth.uid(), 'tesoureiro_central') OR public.has_role(auth.uid(), 'administrador'))
);