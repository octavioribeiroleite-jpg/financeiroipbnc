
## Objetivo
Reorganizar o sistema para uso de um único operador, mantendo o controle por sociedade e os fechamentos mensais, mas removendo a complexidade de múltiplos papéis e fluxos separados.

## Direção proposta
Você será o único usuário ativo do sistema, entrando apenas como administrador. O sistema continuará separando tudo por sociedade, mas a operação diária ficará centralizada numa experiência única:
- você lança contribuições de qualquer sociedade
- você cria e paga solicitações de qualquer sociedade
- você gera e confere fechamentos sem troca de perfil
- relatórios e auditoria continuam disponíveis
- usuários, papéis e telas de “acesso pendente/negado” deixam de fazer parte do fluxo principal

## Como organizar o sistema
### 1. Estrutura funcional
Organizar em 5 blocos principais no menu:
1. Painel Geral
2. Sociedades
3. Lançamentos
4. Fechamentos
5. Configurações

### 2. Módulos resultantes
#### Painel Geral
Uma visão única com:
- saldo consolidado
- contribuições do mês
- pagamentos do mês
- solicitações em aberto
- fechamentos pendentes por sociedade
- atalhos para lançar contribuição, lançar pagamento e fechar mês

#### Sociedades
Manter o cadastro de sociedades e usar cada sociedade como filtro principal da operação.

#### Lançamentos
Substituir a divisão “sociedade / central / igreja” por telas operacionais únicas:
- Contribuições: lista única com filtro por sociedade e ação “nova contribuição”
- Pagamentos/Solicitações: lista única com criação, aprovação e pagamento no mesmo fluxo
- Extrato por sociedade: continua existindo, mas acessado a partir do filtro da sociedade

#### Fechamentos
Unificar:
- fechamento mensal por sociedade
- conferência do fechamento
- consolidação mensal geral
Tudo operado na mesma área, sem depender de papel.

#### Configurações
Concentrar:
- dados da igreja
- fornecedores
- categorias
- opção de resetar tours
- opção futura de ocultar módulos avançados

## O que será simplificado
### Autenticação e acesso
- manter login por e-mail e senha
- considerar apenas o papel de administrador na interface
- remover redirecionamentos por papel em `/`
- remover dependência prática de `tesoureiro_sociedade`, `tesoureiro_central` e `tesoureiro_igreja`
- ocultar/retirar telas de acesso pendente e acesso negado do fluxo principal
- revisar tela de login para remover “solicitar cadastro”, já que não haverá outros usuários usando o sistema

### Navegação
- refatorar `App.tsx` para uma árvore de rotas única
- refatorar `SidebarPainel.tsx` para menu por módulo, não por papel
- ajustar `Index.tsx` para sempre mandar o administrador ao painel geral único

### Dashboard
- transformar os painéis separados em um único painel inicial
- reaproveitar cards e tabelas existentes, mas em layout consolidado

### Tours e ajuda
- manter o tour guiado, mas reescrever textos para o contexto de operador único
- remover menções a “tesoureiro central”, “tesoureiro da igreja” e “tesoureiro da sociedade”
- trocar por textos como “nesta tela você registra...”, “aqui você fecha o mês da sociedade...”

## Estratégia de implementação
### Etapa 1 — Simplificação de acesso e navegação
- ajustar `AuthContext` para priorizar uso como administrador único
- simplificar `RotaProtegida`
- refatorar login e rota inicial
- reescrever sidebar

### Etapa 2 — Unificação da experiência
- criar painel geral único
- consolidar telas operacionais mantendo os hooks atuais onde possível
- reutilizar páginas existentes como base, priorizando filtros por sociedade

### Etapa 3 — Limpeza de fluxo legado
- remover mensagens e textos institucionais voltados a múltiplos usuários
- esconder ou descontinuar telas que não farão mais sentido
- revisar nomenclaturas em botões, títulos e descrições

### Etapa 4 — Ajustes de tours e onboarding
- atualizar todos os tours
- manter reset pelo menu
- alinhar ajuda contextual ao novo fluxo simplificado

## Impacto no banco de dados
Não é necessário remodelar o banco para começar.
A base atual já suporta esse uso individual porque:
- sociedades continuam sendo importantes
- fechamentos continuam por sociedade
- auditoria continua útil
- você pode operar tudo como administrador

### Banco: o que manter agora
- tabelas atuais
- sociedades
- contribuições
- solicitações_pagamento
- movimentacoes_sociedade
- fechamentos_mensais
- auditoria

### Banco: o que pode ficar “legado”
- `papeis_usuario`
- vínculo de usuários adicionais
- fluxos de múltiplos operadores

### Banco: decisão recomendada
Primeiro simplificar a interface e o fluxo sem mexer na estrutura. Depois, se quiser, fazer uma segunda rodada para enxugar regras e dados legados.

## Arquivos mais afetados
- `src/App.tsx`
- `src/pages/Index.tsx`
- `src/components/RotaProtegida.tsx`
- `src/contexts/AuthContext.tsx`
- `src/components/painel/SidebarPainel.tsx`
- `src/pages/Login.tsx`
- `src/pages/painel/Administrador.tsx`
- `src/lib/tour/tours.ts`

Também haverá reaproveitamento/refino em:
- telas de contribuições
- solicitações/pagamentos
- fechamentos
- relatórios

## Resultado esperado
Ao final, o sistema ficará com uma experiência muito mais direta:
- um único login
- um único painel principal
- operação centralizada por filtros de sociedade
- menos cliques e menos mudança de contexto
- mesma segurança e mesma rastreabilidade
- mesma separação financeira por sociedade

## Observação técnica
Como o projeto hoje está fortemente organizado por papéis, a melhor abordagem não é “desligar” tudo de uma vez, e sim:
1. manter a base atual
2. simplificar a interface
3. centralizar os fluxos
4. só depois decidir se vale limpar regras legadas do banco

Isso reduz risco e preserva seus dados já lançados.
