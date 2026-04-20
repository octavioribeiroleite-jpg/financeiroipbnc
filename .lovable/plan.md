
## Objetivo
Melhorar o sistema para o seu uso individual, deixando a operação mais rápida, com menos troca de tela, menos etapas manuais e mais visão por sociedade.

## Melhorias mais valiosas para o seu cenário
### 1. Seletor global de sociedade
Adicionar um seletor fixo de sociedade no topo das telas operacionais para você trocar rapidamente o contexto sem precisar navegar entre módulos separados.

### 2. Unificar contribuições
Transformar a tela de contribuições em uma visão única:
- filtro por sociedade
- botão de novo lançamento
- edição rápida
- status simplificado para operador único

### 3. Unificar pagamentos
Juntar criação, análise, aprovação e quitação na mesma tela de pagamentos:
- você cria o pedido
- já pode marcar como aprovado
- já pode registrar como pago
- sem depender do fluxo antigo de “central”

### 4. Fechamento mensal mais direto
Simplificar o fechamento por sociedade:
- criar fechamento
- recalcular
- conferir
- consolidar
Tudo em uma única experiência, com menos separação entre “sociedade”, “central” e “igreja”.

### 5. Painel realmente útil no dia a dia
Trocar o foco do painel atual por indicadores acionáveis:
- saldo por sociedade
- pagamentos vencendo hoje/semana
- solicitações em aberto
- contribuições ainda não conferidas
- sociedades sem fechamento no mês
- atalhos para “lançar agora”

### 6. Extrato com navegação melhor
Melhorar o extrato para uso operacional:
- troca rápida de sociedade
- resumo por período
- filtros salvos
- destaque para saldo negativo
- exportação mais prática

### 7. Menos linguagem de múltiplos usuários
Remover do app os termos que sobraram do modelo antigo:
- “enviar para análise”
- “tesouraria central”
- “sua conta não está vinculada”
- “sociedade vê suas solicitações”
Substituir por textos diretos, pensados para um operador único.

## Organização recomendada do sistema
### Menu ideal
1. Painel Geral
2. Sociedades
3. Contribuições
4. Pagamentos
5. Fechamentos
6. Relatórios
7. Configurações

### Lógica de uso
```text
Sociedade escolhida
   ↓
Registrar contribuição / pagamento
   ↓
Extrato atualizado
   ↓
Fechamento do mês
   ↓
Relatório consolidado
```

## Ordem recomendada de implementação
### Etapa 1 — Ganho rápido de usabilidade
- adicionar seletor global de sociedade
- ajustar painel inicial para métricas acionáveis
- simplificar textos e títulos da interface

### Etapa 2 — Operação centralizada
- unificar tela de contribuições
- unificar tela de pagamentos
- reduzir dependência visual das rotas “sociedade/central/igreja”

### Etapa 3 — Fechamentos simplificados
- transformar fechamento em fluxo único
- manter consolidação mensal, mas com linguagem simples
- destacar pendências por sociedade

### Etapa 4 — Relatórios para gestão pessoal
- presets de período
- exportação mais rápida
- resumo mensal por sociedade
- visão consolidada do mês

## O que eu recomendo fazer primeiro
### Prioridade alta
1. Seletor global de sociedade
2. Unificação de pagamentos
3. Painel com alertas e pendências

Essas três mudanças já deixam o sistema muito mais confortável para uso individual.

## Ajustes específicos percebidos no código atual
### Contribuições
Hoje a tela ainda depende de `sociedadeId` do usuário autenticado. Para o seu novo cenário, ela deve aceitar qualquer sociedade selecionada por você.

### Pagamentos
Hoje a criação está numa tela e o processamento em outra. Para uso solo, o ideal é fundir esses dois passos.

### Fechamentos
Hoje o fluxo ainda está dividido em camadas antigas. O ideal é manter a segurança dos dados, mas unificar a interface.

### Tours
O texto dos tours ainda pode ser simplificado mais, focando em “você opera tudo daqui”.

## Resultado esperado
Depois dessa rodada, o sistema vai ficar:
- mais rápido para lançar movimentações
- mais simples de navegar
- mais natural para controlar várias sociedades sozinho
- menos preso à lógica antiga de múltiplos usuários
- mais próximo de um “painel de tesouraria pessoal”, sem perder organização por sociedade

## Detalhes técnicos
- Reaproveitar as rotas e hooks atuais, mas permitir seleção explícita de sociedade nas telas principais.
- Unificar componentes de listagem usando a base já existente de `DataTable`.
- Adaptar telas de contribuições, solicitações e fechamentos para um modo “operador único”.
- Preservar banco e regras atuais nesta fase, mexendo primeiro na experiência.
- Deixar limpeza mais profunda de fluxo legado para uma segunda etapa, se fizer sentido.

## Entrega sugerida nesta próxima implementação
Uma primeira entrega enxuta e de alto impacto:
- seletor global de sociedade
- tela única de pagamentos
- painel geral com pendências reais
- textos revisados para uso individual
