# Plano de controle financeiro por sociedade

## Objetivo

Organizar o dinheiro das sociedades da igreja em um caixa consolidado, mantendo um saldo separado para cada sociedade como um cofrinho interno.

Mesmo que o dinheiro esteja em uma conta bancária única, cada entrada e saída precisa pertencer a uma sociedade. O saldo consolidado da igreja deve ser a soma dos saldos confirmados de todas as sociedades.

## Fonte de verdade

A tabela `movimentacoes_sociedade` deve ser a fonte principal para cálculo de saldo, relatório e extrato.

Cada movimentação precisa ter:

- sociedade;
- tipo: entrada, saída ou ajuste;
- valor;
- data do movimento;
- origem;
- status de confirmação;
- usuário responsável;
- observação ou descrição.

Contribuições e solicitações de pagamento podem continuar existindo como telas de origem, mas o impacto financeiro deve aparecer como movimentação confirmada.

## Painel principal

O painel deve responder rapidamente:

- quanto existe no caixa consolidado;
- quanto entrou no mês;
- quanto saiu no mês;
- quanto pertence a cada sociedade;
- qual sociedade está selecionada para operação;
- quais lançamentos ainda precisam de conferência ou pagamento.

## Cofrinho por sociedade

Cada sociedade deve ter:

- saldo inicial do mês;
- entradas do mês;
- saídas do mês;
- saldo final do mês;
- saldo atual;
- extrato detalhado com saldo acumulado linha a linha.

## Entradas

Uma entrada deve aumentar o saldo da sociedade quando confirmada.

Campos recomendados:

- sociedade;
- origem ou nome do contribuinte;
- valor;
- data;
- forma de pagamento;
- comprovante opcional;
- observação.

## Saídas

Uma saída deve diminuir o saldo da sociedade quando o pagamento for confirmado.

Campos recomendados:

- sociedade;
- fornecedor ou descrição;
- categoria;
- valor;
- vencimento;
- data de pagamento;
- comprovante opcional;
- status.

## Relatório mensal

O relatório mensal deve trazer:

- resumo consolidado da igreja;
- resumo por sociedade com saldo inicial, entradas, saídas, saldo final e saldo atual;
- entradas detalhadas;
- saídas detalhadas;
- movimentações completas;
- pendências de conferência ou pagamento;
- exportação em CSV e, futuramente, PDF.

## Fechamento mensal

Ao fechar um mês:

- as movimentações daquele mês devem ficar bloqueadas para edição comum;
- qualquer correção deve exigir reabertura com justificativa;
- a reabertura deve ficar registrada em auditoria;
- o relatório fechado deve ser reproduzível depois.

## Regras importantes

- Nenhuma movimentação financeira deve existir sem sociedade.
- Saldos e relatórios devem considerar apenas movimentações confirmadas.
- Movimentações pendentes podem aparecer em listas de atenção, mas não devem alterar o saldo oficial.
- O administrador pode ver todas as sociedades.
- Usuários vinculados a uma sociedade devem operar somente sua sociedade, conforme as regras do banco.
