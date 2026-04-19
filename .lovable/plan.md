
# ETAPA 1 — Arquitetura e Banco de Dados

## Objetivo da etapa
Modelar toda a base de dados do sistema de tesouraria, definindo tabelas, relacionamentos, perfis de acesso e o fluxo lógico institucional. **Nesta etapa não será construída nenhuma tela.** Apenas a fundação do banco e das regras de segurança.

---

## 1. Papel de cada tabela no fluxo

**Dados estruturais (cadastros base)**
- `sociedades` — define cada sociedade interna da igreja (UCP, UMP, UPH, SAF, UPA, etc.).
- `usuarios` (perfis) — pessoas autenticadas, vinculadas a uma função e, quando aplicável, a uma sociedade.
- `papeis_usuario` — tabela separada de papéis (administrador, tesoureiro_igreja, tesoureiro_central, tesoureiro_sociedade), seguindo boas práticas de segurança.
- `fornecedores` — quem recebe pagamentos institucionais.
- `categorias` — classificação de entradas e saídas.

**Dados operacionais (dia a dia da sociedade)**
- `contribuicoes` — entradas alimentadas pelo tesoureiro da sociedade.
- `solicitacoes_pagamento` — pedidos criados pela sociedade e executados pelo central.

**Dados consolidadores (gerencial)**
- `movimentacoes_sociedade` — livro-razão imutável de cada sociedade (alimentado automaticamente).
- `fechamentos_mensais` — fotografia mensal por sociedade.
- `auditoria` — histórico imutável de ações críticas.

---

## 2. Diagrama lógico (texto)

```
sociedades ──────┬───< usuarios (tesoureiro_sociedade)
                 ├───< contribuicoes
                 ├───< solicitacoes_pagamento >── fornecedores
                 ├───< movimentacoes_sociedade
                 └───< fechamentos_mensais

usuarios ────< papeis_usuario
usuarios ────< auditoria
categorias ──< solicitacoes_pagamento
categorias ──< fornecedores

contribuicoes ─────► gera ► movimentacoes_sociedade (entrada)
solicitacoes_pagamento (paga) ► gera ► movimentacoes_sociedade (saida)
movimentacoes_sociedade ──► alimenta ► fechamentos_mensais
```

---

## 3. Tabelas e campos principais

| Tabela | Campos principais |
|---|---|
| **sociedades** | id, nome, tipo, status, data_criacao |
| **usuarios** (perfis) | id (=auth.uid), nome, email, sociedade_id (nulo para central/igreja/admin), ativo, data_criacao |
| **papeis_usuario** | id, usuario_id, papel (enum) |
| **fornecedores** | id, nome_fantasia, razao_social, cnpj, chave_pix, banco, categoria_id, ativo, observacoes |
| **categorias** | id, nome, tipo (entrada/saida), ativo |
| **contribuicoes** | id, sociedade_id, membro_nome, referencia_mes, valor, data_pagamento, forma_pagamento, comprovante_url, observacao, criado_por, status_conferencia |
| **solicitacoes_pagamento** | id, sociedade_id, fornecedor_id, descricao, categoria_id, valor, vencimento, observacoes, anexo_nota_url, anexo_comprovante_url, status, criado_por, conferido_por, pago_por, data_pagamento |
| **movimentacoes_sociedade** | id, sociedade_id, tipo (entrada/saida/ajuste), origem, referencia_id, valor, data_movimento, observacao, criado_por (imutável após confirmação) |
| **fechamentos_mensais** | id, sociedade_id, mes, ano, saldo_inicial, total_entradas, total_saidas, saldo_final, enviado_por, conferido_por, status |
| **auditoria** | id, usuario_id, acao, modulo, registro_id, data_hora, detalhes (JSON) |

Enums:
- `app_role`: administrador, tesoureiro_igreja, tesoureiro_central, tesoureiro_sociedade
- `status_solicitacao`: rascunho, enviada, em_analise, aprovada, recusada, paga
- `status_fechamento`: aberto, enviado, conferido, consolidado
- `status_conferencia`: pendente, conferida, divergente
- `tipo_movimento`: entrada, saida, ajuste

---

## 4. Relacionamentos

- `usuarios.sociedade_id → sociedades.id` (obrigatório apenas para tesoureiro_sociedade).
- `papeis_usuario.usuario_id → usuarios.id` (papéis em tabela separada — evita escalonamento de privilégio).
- `contribuicoes.sociedade_id → sociedades.id`.
- `solicitacoes_pagamento.sociedade_id → sociedades.id` e `fornecedor_id → fornecedores.id`.
- `movimentacoes_sociedade.sociedade_id → sociedades.id`, com `origem` + `referencia_id` apontando para contribuição, solicitação ou ajuste.
- `fechamentos_mensais.sociedade_id → sociedades.id` (único por mês/ano/sociedade).
- `auditoria.usuario_id → usuarios.id`.

---

## 5. Lógica do fluxo institucional

1. **Tesoureiro da sociedade** registra contribuições e cria solicitações de pagamento — só enxerga a própria sociedade.
2. **Tesoureiro central** confere contribuições, analisa solicitações (aprova/recusa/devolve) e registra o pagamento ao fornecedor — gera automaticamente a saída na movimentação da sociedade correspondente.
3. **Movimentações confirmadas são imutáveis**: correções só por lançamento de ajuste.
4. **Fechamento mensal** calcula saldos automaticamente a partir das movimentações válidas, é enviado pela sociedade, conferido pelo central e disponibilizado ao tesoureiro da igreja.
5. **Tesoureiro da igreja** recebe o consolidado geral e o balancete.
6. **Administrador** mantém cadastros (usuários, sociedades, fornecedores, categorias) e supervisiona auditoria.
7. **Auditoria** registra automaticamente: criação, edição, conferência, aprovação, recusa, pagamento, fechamento e consolidação.

---

## 6. Segurança (RLS — fundação)

- Função `has_role(user_id, role)` em `SECURITY DEFINER` para evitar recursão em políticas.
- Função `get_user_sociedade(user_id)` para isolar dados por sociedade.
- Políticas por tabela:
  - **Tesoureiro da sociedade**: SELECT/INSERT apenas onde `sociedade_id = get_user_sociedade(auth.uid())`.
  - **Tesoureiro central**: SELECT/UPDATE em todas as sociedades nos módulos operacionais.
  - **Tesoureiro da igreja**: SELECT em fechamentos consolidados e relatórios.
  - **Administrador**: acesso total aos cadastros e à auditoria.
- DELETE bloqueado em `movimentacoes_sociedade` confirmadas e em `solicitacoes_pagamento` com status `paga`.
- Triggers para: alimentar `movimentacoes_sociedade` automaticamente, registrar `auditoria` e impedir alterações indevidas.

---

## 7. O que será entregue nesta etapa (após sua aprovação)

- Criação dos enums.
- Criação das tabelas acima com chaves e índices.
- Função `has_role` + função auxiliar de sociedade.
- Políticas RLS iniciais por perfil.
- Triggers de auditoria e de geração automática de movimentações.
- Bloqueio de exclusão de lançamentos confirmados.
- **Nenhuma tela será criada nesta etapa.**

---

## Próxima etapa (após esta)
Etapa 2 — Autenticação, sessão, tela de login e amarração dos perfis na interface.

**Aguardando sua aprovação para executar a Etapa 1.**
