import { useMemo, useState } from "react";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabelaRelatorio, ColunaTabela } from "@/components/igreja/TabelaRelatorio";
import { StatusContribuicaoBadge } from "@/components/sociedade/StatusContribuicaoBadge";
import { StatusSolicitacaoBadge } from "@/components/sociedade/StatusSolicitacaoBadge";
import {
  useRelatorioContribuicoes,
  useRelatorioPagamentos,
  useRelatorioMovimentacoes,
} from "@/hooks/igreja/useRelatorios";
import { useSaldoPorSociedade } from "@/hooks/igreja/useSaldoPorSociedade";
import { useSociedades } from "@/hooks/cadastros/useSociedades";
import { useCategorias } from "@/hooks/cadastros/useCategorias";
import { useFornecedores } from "@/hooks/cadastros/useFornecedores";
import { formatarData, formatarMoeda, primeiroDiaMesAtual, hojeISO } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

const TODOS = "__todos__";

type StatusConf = Database["public"]["Enums"]["status_conferencia"];
type StatusSolic = Database["public"]["Enums"]["status_solicitacao"];

export default function IgrejaRelatorios() {
  const [inicio, setInicio] = useState(primeiroDiaMesAtual());
  const [fim, setFim] = useState(hojeISO());
  const [sociedadeId, setSociedadeId] = useState<string>(TODOS);

  const { data: sociedades = [] } = useSociedades();
  const { data: categorias = [] } = useCategorias();
  const { data: fornecedores = [] } = useFornecedores();

  const sociedadeMap = useMemo(
    () => new Map(sociedades.map((s) => [s.id, s.nome])),
    [sociedades],
  );
  const categoriaMap = useMemo(
    () => new Map(categorias.map((c) => [c.id, c.nome])),
    [categorias],
  );
  const fornecedorMap = useMemo(
    () => new Map(fornecedores.map((f) => [f.id, f.nome_fantasia])),
    [fornecedores],
  );

  return (
    <ShellPainel
      titulo="Relatórios"
      descricao="Consultas consolidadas com filtro por período e exportação para CSV."
    >
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Relatórios</h2>
        <p className="text-muted-foreground">
          Consultas consolidadas com filtro por período e exportação para CSV.
        </p>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="inicio">Início</Label>
              <Input
                id="inicio"
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fim">Fim</Label>
              <Input
                id="fim"
                type="date"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Sociedade</Label>
              <Select value={sociedadeId} onValueChange={setSociedadeId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todas</SelectItem>
                  {sociedades.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="contribuicoes">
        <TabsList>
          <TabsTrigger value="contribuicoes">Contribuições</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
        </TabsList>

        <TabsContent value="contribuicoes" className="mt-4">
          <AbaContribuicoes
            inicio={inicio}
            fim={fim}
            sociedadeId={sociedadeId === TODOS ? null : sociedadeId}
            sociedadeMap={sociedadeMap}
          />
        </TabsContent>

        <TabsContent value="pagamentos" className="mt-4">
          <AbaPagamentos
            inicio={inicio}
            fim={fim}
            sociedadeId={sociedadeId === TODOS ? null : sociedadeId}
            sociedadeMap={sociedadeMap}
            categoriaMap={categoriaMap}
            fornecedorMap={fornecedorMap}
            categorias={categorias}
            fornecedores={fornecedores}
          />
        </TabsContent>

        <TabsContent value="movimentacoes" className="mt-4">
          <AbaMovimentacoes
            inicio={inicio}
            fim={fim}
            sociedadeId={sociedadeId === TODOS ? null : sociedadeId}
            sociedadeMap={sociedadeMap}
          />
        </TabsContent>

        <TabsContent value="resumo" className="mt-4">
          <AbaResumo
            inicio={inicio}
            fim={fim}
            sociedadeId={sociedadeId === TODOS ? null : sociedadeId}
            sociedades={sociedades}
          />
        </TabsContent>
      </Tabs>
    </ShellPainel>
  );
}

// ---------- Contribuições ----------
function AbaContribuicoes({
  inicio,
  fim,
  sociedadeId,
  sociedadeMap,
}: {
  inicio: string;
  fim: string;
  sociedadeId: string | null;
  sociedadeMap: Map<string, string>;
}) {
  const [status, setStatus] = useState<string>(TODOS);
  const [forma, setForma] = useState<string>(TODOS);
  const { data = [], isLoading } = useRelatorioContribuicoes({
    inicio,
    fim,
    sociedadeId,
    status: status === TODOS ? null : (status as StatusConf),
    forma: forma === TODOS ? null : forma,
  });

  const total = data.reduce((s, c) => s + Number(c.valor || 0), 0);

  const colunas: ColunaTabela<typeof data[number]>[] = [
    { cabecalho: "Data", render: (r) => formatarData(r.data_pagamento), valorCsv: (r) => formatarData(r.data_pagamento) },
    { cabecalho: "Sociedade", render: (r) => sociedadeMap.get(r.sociedade_id) ?? "—", valorCsv: (r) => sociedadeMap.get(r.sociedade_id) ?? "" },
    { cabecalho: "Membro", render: (r) => r.membro_nome, valorCsv: (r) => r.membro_nome },
    { cabecalho: "Forma", render: (r) => r.forma_pagamento, valorCsv: (r) => r.forma_pagamento },
    { cabecalho: "Status", render: (r) => <StatusContribuicaoBadge status={r.status_conferencia} />, valorCsv: (r) => r.status_conferencia, alinhamento: "center" },
    { cabecalho: "Valor", render: (r) => formatarMoeda(Number(r.valor)), valorCsv: (r) => Number(r.valor), alinhamento: "right" },
  ];

  return (
    <TabelaRelatorio
      titulo="Contribuições"
      colunas={colunas}
      dados={data}
      loading={isLoading}
      nomeArquivo={`contribuicoes_${inicio}_${fim}`}
      acoes={
        <div className="flex gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="conferida">Conferida</SelectItem>
              <SelectItem value="divergente">Divergente</SelectItem>
            </SelectContent>
          </Select>
          <Select value={forma} onValueChange={setForma}>
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Forma" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas formas</SelectItem>
              <SelectItem value="dinheiro">Dinheiro</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="transferencia">Transferência</SelectItem>
              <SelectItem value="cartao">Cartão</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
      rodape={
        <div className="flex justify-between">
          <span className="text-muted-foreground">{data.length} registro(s)</span>
          <span className="font-semibold">Total: {formatarMoeda(total)}</span>
        </div>
      }
    />
  );
}

// ---------- Pagamentos ----------
function AbaPagamentos({
  inicio,
  fim,
  sociedadeId,
  sociedadeMap,
  categoriaMap,
  fornecedorMap,
  categorias,
  fornecedores,
}: {
  inicio: string;
  fim: string;
  sociedadeId: string | null;
  sociedadeMap: Map<string, string>;
  categoriaMap: Map<string, string>;
  fornecedorMap: Map<string, string>;
  categorias: { id: string; nome: string }[];
  fornecedores: { id: string; nome_fantasia: string }[];
}) {
  const [status, setStatus] = useState<string>(TODOS);
  const [categoriaId, setCategoriaId] = useState<string>(TODOS);
  const [fornecedorId, setFornecedorId] = useState<string>(TODOS);

  const { data = [], isLoading } = useRelatorioPagamentos({
    inicio,
    fim,
    sociedadeId,
    status: status === TODOS ? null : (status as StatusSolic),
    categoriaId: categoriaId === TODOS ? null : categoriaId,
    fornecedorId: fornecedorId === TODOS ? null : fornecedorId,
  });

  const total = data.reduce((s, x) => s + Number(x.valor || 0), 0);
  const totalPagas = data.filter((x) => x.status === "paga").reduce((s, x) => s + Number(x.valor || 0), 0);

  const colunas: ColunaTabela<typeof data[number]>[] = [
    { cabecalho: "Vencimento", render: (r) => formatarData(r.vencimento), valorCsv: (r) => formatarData(r.vencimento) },
    { cabecalho: "Sociedade", render: (r) => sociedadeMap.get(r.sociedade_id) ?? "—", valorCsv: (r) => sociedadeMap.get(r.sociedade_id) ?? "" },
    { cabecalho: "Fornecedor", render: (r) => fornecedorMap.get(r.fornecedor_id) ?? "—", valorCsv: (r) => fornecedorMap.get(r.fornecedor_id) ?? "" },
    { cabecalho: "Categoria", render: (r) => (r.categoria_id ? categoriaMap.get(r.categoria_id) ?? "—" : "—"), valorCsv: (r) => (r.categoria_id ? categoriaMap.get(r.categoria_id) ?? "" : "") },
    { cabecalho: "Descrição", render: (r) => r.descricao, valorCsv: (r) => r.descricao },
    { cabecalho: "Status", render: (r) => <StatusSolicitacaoBadge status={r.status} />, valorCsv: (r) => r.status, alinhamento: "center" },
    { cabecalho: "Pago em", render: (r) => formatarData(r.data_pagamento), valorCsv: (r) => formatarData(r.data_pagamento) },
    { cabecalho: "Valor", render: (r) => formatarMoeda(Number(r.valor)), valorCsv: (r) => Number(r.valor), alinhamento: "right" },
  ];

  return (
    <TabelaRelatorio
      titulo="Pagamentos (solicitações)"
      colunas={colunas}
      dados={data}
      loading={isLoading}
      nomeArquivo={`pagamentos_${inicio}_${fim}`}
      acoes={
        <div className="flex flex-wrap gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos status</SelectItem>
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="enviada">Enviada</SelectItem>
              <SelectItem value="em_analise">Em análise</SelectItem>
              <SelectItem value="aprovada">Aprovada</SelectItem>
              <SelectItem value="recusada">Recusada</SelectItem>
              <SelectItem value="paga">Paga</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoriaId} onValueChange={setCategoriaId}>
            <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas categorias</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fornecedorId} onValueChange={setFornecedorId}>
            <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Fornecedor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos fornecedores</SelectItem>
              {fornecedores.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.nome_fantasia}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
      rodape={
        <div className="flex flex-wrap justify-between gap-2">
          <span className="text-muted-foreground">{data.length} registro(s)</span>
          <div className="flex gap-4">
            <span>Total geral: <strong>{formatarMoeda(total)}</strong></span>
            <span>Total pago: <strong>{formatarMoeda(totalPagas)}</strong></span>
          </div>
        </div>
      }
    />
  );
}

// ---------- Movimentações ----------
function AbaMovimentacoes({
  inicio,
  fim,
  sociedadeId,
  sociedadeMap,
}: {
  inicio: string;
  fim: string;
  sociedadeId: string | null;
  sociedadeMap: Map<string, string>;
}) {
  const { data = [], isLoading } = useRelatorioMovimentacoes({ inicio, fim, sociedadeId });

  const confirmadas = data.filter((m) => m.confirmada);
  const entradas = confirmadas.filter((m) => m.tipo === "entrada").reduce((s, m) => s + Number(m.valor || 0), 0);
  const saidas = confirmadas.filter((m) => m.tipo === "saida").reduce((s, m) => s + Number(m.valor || 0), 0);
  const saldoPeriodo = entradas - saidas;

  const colunas: ColunaTabela<typeof data[number]>[] = [
    { cabecalho: "Data", render: (r) => formatarData(r.data_movimento), valorCsv: (r) => formatarData(r.data_movimento) },
    { cabecalho: "Sociedade", render: (r) => sociedadeMap.get(r.sociedade_id) ?? "—", valorCsv: (r) => sociedadeMap.get(r.sociedade_id) ?? "" },
    { cabecalho: "Tipo", render: (r) => r.tipo, valorCsv: (r) => r.tipo },
    { cabecalho: "Origem", render: (r) => r.origem, valorCsv: (r) => r.origem },
    { cabecalho: "Observação", render: (r) => r.observacao ?? "—", valorCsv: (r) => r.observacao ?? "" },
    { cabecalho: "Status", render: (r) => (r.confirmada ? "Confirmada" : "Pendente"), valorCsv: (r) => (r.confirmada ? "Confirmada" : "Pendente"), alinhamento: "center" },
    { cabecalho: "Valor", render: (r) => formatarMoeda(Number(r.valor)), valorCsv: (r) => Number(r.valor), alinhamento: "right" },
  ];

  return (
    <TabelaRelatorio
      titulo={sociedadeId ? `Movimentações — ${sociedadeMap.get(sociedadeId) ?? ""}` : "Movimentações — todas as sociedades"}
      colunas={colunas}
      dados={data}
      loading={isLoading}
      nomeArquivo={`movimentacoes_${inicio}_${fim}`}
      rodape={
        <div className="flex flex-wrap justify-between gap-2">
          <span className="text-muted-foreground">{data.length} registro(s)</span>
          <div className="flex gap-4">
            <span className="text-emerald-600">Entradas: <strong>{formatarMoeda(entradas)}</strong></span>
            <span className="text-rose-600">Saídas: <strong>{formatarMoeda(saidas)}</strong></span>
            <span>Saldo período: <strong>{formatarMoeda(saldoPeriodo)}</strong></span>
          </div>
        </div>
      }
    />
  );
}

// ---------- Resumo por sociedade ----------
function AbaResumo({
  inicio,
  fim,
  sociedadeId,
}: {
  inicio: string;
  fim: string;
  sociedadeId: string | null;
  sociedades: { id: string; nome: string; tipo: string }[];
}) {
  const { data: saldos = [], isLoading } = useSaldoPorSociedade(inicio);

  const lista = saldos.filter((s) => !sociedadeId || s.sociedadeId === sociedadeId);

  const colunas: ColunaTabela<typeof lista[number]>[] = [
    { cabecalho: "Sociedade", render: (r) => r.nome, valorCsv: (r) => r.nome },
    { cabecalho: "Tipo", render: (r) => r.tipo, valorCsv: (r) => r.tipo },
    { cabecalho: "Saldo inicial", render: (r) => formatarMoeda(r.saldoInicial), valorCsv: (r) => r.saldoInicial, alinhamento: "right" },
    { cabecalho: "Entradas", render: (r) => formatarMoeda(r.entradasMes), valorCsv: (r) => r.entradasMes, alinhamento: "right" },
    { cabecalho: "Saídas", render: (r) => formatarMoeda(r.saidasMes), valorCsv: (r) => r.saidasMes, alinhamento: "right" },
    { cabecalho: "Saldo final", render: (r) => formatarMoeda(r.saldoFinalMes), valorCsv: (r) => r.saldoFinalMes, alinhamento: "right" },
    { cabecalho: "Saldo atual", render: (r) => formatarMoeda(r.saldoAtual), valorCsv: (r) => r.saldoAtual, alinhamento: "right" },
  ];

  const totSaldoInicial = lista.reduce((s, x) => s + x.saldoInicial, 0);
  const totEntradas = lista.reduce((s, x) => s + x.entradasMes, 0);
  const totSaidas = lista.reduce((s, x) => s + x.saidasMes, 0);
  const totSaldoFinal = lista.reduce((s, x) => s + x.saldoFinalMes, 0);

  return (
    <TabelaRelatorio
      titulo="Resumo por sociedade"
      colunas={colunas}
      dados={lista}
      loading={isLoading}
      nomeArquivo={`resumo_sociedades_${inicio}_${fim}`}
      rodape={
        <div className="flex flex-wrap justify-between gap-2">
          <span className="text-muted-foreground">{lista.length} sociedade(s)</span>
          <div className="flex gap-4">
            <span>Inicial: <strong>{formatarMoeda(totSaldoInicial)}</strong></span>
            <span className="text-emerald-600">Entradas: <strong>{formatarMoeda(totEntradas)}</strong></span>
            <span className="text-rose-600">Saídas: <strong>{formatarMoeda(totSaidas)}</strong></span>
            <span>Final: <strong>{formatarMoeda(totSaldoFinal)}</strong></span>
          </div>
        </div>
      }
    />
  );
}
