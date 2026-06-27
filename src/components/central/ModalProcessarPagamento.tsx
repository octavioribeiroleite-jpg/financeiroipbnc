import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UploadAnexo } from "@/components/shared/UploadAnexo";
import { StatusSolicitacaoBadge } from "@/components/sociedade/StatusSolicitacaoBadge";
import { ViewSolicitacao } from "@/components/sociedade/ViewSolicitacao";
import { useCategorias } from "@/hooks/cadastros/useCategorias";
import { useFornecedores } from "@/hooks/cadastros/useFornecedores";
import { useSociedades } from "@/hooks/cadastros/useSociedades";
import {
  type AcaoProcessamento,
  type Solicitacao,
  useProcessarSolicitacao,
} from "@/hooks/central/useSolicitacoesCentral";
import { useMesConsolidado } from "@/hooks/fechamentos/useMesConsolidado";
import { useResumoSociedade } from "@/hooks/sociedade/useResumoSociedade";
import { formatarData, formatarMoeda, hojeISO } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck2,
  RotateCcw,
  Wallet,
  XCircle,
} from "lucide-react";

type Etapa = 1 | 2 | 3;
type Decisao = "aprovar" | "devolver" | "recusar";
type ModoPagamento = "depois" | "agora";

interface Props {
  solicitacao: Solicitacao | null;
  open: boolean;
  onClose: () => void;
}

const ETAPAS = [
  { numero: 1 as const, rotulo: "Conferência" },
  { numero: 2 as const, rotulo: "Decisão" },
  { numero: 3 as const, rotulo: "Pagamento" },
];

function Opcao({
  selecionada,
  titulo,
  descricao,
  icone,
  onClick,
  destrutiva,
}: {
  selecionada: boolean;
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
  onClick: () => void;
  destrutiva?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all",
        "hover:border-primary/40 hover:bg-muted/40",
        selecionada && !destrutiva && "border-primary bg-primary/5 ring-1 ring-primary/20",
        selecionada && destrutiva && "border-destructive bg-destructive/5 ring-1 ring-destructive/20",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground",
          selecionada && !destrutiva && "bg-primary text-primary-foreground",
          selecionada && destrutiva && "bg-destructive text-destructive-foreground",
        )}
      >
        {icone}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{titulo}</span>
        <span className="mt-1 block text-sm leading-5 text-muted-foreground">{descricao}</span>
      </span>
      {selecionada && <Check className="mt-1 h-5 w-5 shrink-0" />}
    </button>
  );
}

export function ModalProcessarPagamento({ solicitacao, open, onClose }: Props) {
  const processar = useProcessarSolicitacao();
  const { data: sociedades = [] } = useSociedades();
  const { data: fornecedores = [] } = useFornecedores();
  const { data: categorias = [] } = useCategorias();

  const [etapa, setEtapa] = useState<Etapa>(1);
  const [conferenciaOk, setConferenciaOk] = useState(false);
  const [decisao, setDecisao] = useState<Decisao | null>(null);
  const [motivo, setMotivo] = useState("");
  const [modoPagamento, setModoPagamento] = useState<ModoPagamento | null>(null);
  const [dataPagamento, setDataPagamento] = useState(hojeISO());
  const [comprovanteUrl, setComprovanteUrl] = useState<string | null>(null);
  const [observacoes, setObservacoes] = useState("");
  const [concluido, setConcluido] = useState<AcaoProcessamento | null>(null);

  const somenteVisualizar = solicitacao
    ? ["rascunho", "recusada", "paga"].includes(solicitacao.status)
    : true;
  const jaAprovada = solicitacao?.status === "aprovada";

  useEffect(() => {
    if (!open || !solicitacao) return;
    setEtapa(solicitacao.status === "aprovada" ? 3 : 1);
    setConferenciaOk(false);
    setDecisao(null);
    setMotivo("");
    setModoPagamento(solicitacao.status === "aprovada" ? "agora" : null);
    setDataPagamento(hojeISO());
    setComprovanteUrl(null);
    setObservacoes("");
    setConcluido(null);
  }, [open, solicitacao?.id, solicitacao?.status]);

  const sociedade = sociedades.find((item) => item.id === solicitacao?.sociedade_id);
  const fornecedor = fornecedores.find((item) => item.id === solicitacao?.fornecedor_id);
  const categoria = categorias.find((item) => item.id === solicitacao?.categoria_id);

  const { data: resumo, isLoading: carregandoSaldo } = useResumoSociedade(
    solicitacao?.sociedade_id ?? null,
  );
  const { data: mesTravado } = useMesConsolidado(
    solicitacao?.sociedade_id ?? null,
    dataPagamento,
  );

  const dataFutura = dataPagamento > hojeISO();
  const saldoAtual = resumo?.saldoAtual ?? 0;
  const saldoDepois = solicitacao ? saldoAtual - Number(solicitacao.valor) : saldoAtual;
  const saldoNegativo = !carregandoSaldo && saldoDepois < 0;

  const tituloConclusao = useMemo(() => {
    if (concluido === "aprovar") return "Pagamento aprovado";
    if (concluido === "devolver") return "Solicitação devolvida";
    if (concluido === "recusar") return "Solicitação recusada";
    return "Pagamento concluído";
  }, [concluido]);

  const descricaoConclusao = useMemo(() => {
    if (concluido === "aprovar") return "A solicitação ficou na fila de aprovadas para pagamento posterior.";
    if (concluido === "devolver") return "A sociedade poderá corrigir os dados e enviar novamente.";
    if (concluido === "recusar") return "A solicitação foi encerrada e o motivo ficou registrado.";
    return `A saída foi registrada no extrato de ${sociedade?.nome ?? "sociedade"}.`;
  }, [concluido, sociedade?.nome]);

  const fechar = () => {
    if (processar.isPending) return;
    onClose();
  };

  const executar = (acao: AcaoProcessamento) => {
    if (!solicitacao) return;
    processar.mutate(
      {
        id: solicitacao.id,
        acao,
        motivo: motivo.trim() || null,
        dataPagamento: acao === "pagar" || acao === "aprovar_pagar" ? dataPagamento : null,
        comprovanteUrl: acao === "pagar" || acao === "aprovar_pagar" ? comprovanteUrl : null,
        observacoes: observacoes.trim() || null,
      },
      { onSuccess: () => setConcluido(acao) },
    );
  };

  if (!solicitacao) return null;

  const podeConfirmarPagamento =
    !!comprovanteUrl && !!dataPagamento && !dataFutura && !mesTravado && !processar.isPending;

  return (
    <Dialog open={open} onOpenChange={(aberto) => !aberto && fechar()}>
      <DialogContent className="max-h-[92vh] max-w-3xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 pb-4 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3 pr-7">
            <div>
              <DialogTitle>{somenteVisualizar ? "Detalhes do pagamento" : "Processar pagamento"}</DialogTitle>
              <DialogDescription className="mt-1">
                Todo o processo pode ser concluído nesta janela.
              </DialogDescription>
            </div>
            <StatusSolicitacaoBadge status={solicitacao.status} />
          </div>

          <div className="mt-4 rounded-xl border bg-muted/25 p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <p className="truncate font-semibold">{fornecedor?.nome_fantasia ?? "Fornecedor não encontrado"}</p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{solicitacao.descricao}</p>
              </div>
              <div className="shrink-0 text-left sm:text-right">
                <p className="text-xl font-bold">{formatarMoeda(Number(solicitacao.valor))}</p>
                <p className="text-xs text-muted-foreground">
                  {sociedade?.nome ?? "—"} · vence em {formatarData(solicitacao.vencimento)}
                </p>
              </div>
            </div>
          </div>

          {!somenteVisualizar && !concluido && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {ETAPAS.map((item, indice) => {
                const ativa = etapa === item.numero;
                const completa = etapa > item.numero || (jaAprovada && item.numero < 3);
                return (
                  <div key={item.numero} className="flex min-w-0 items-center">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                          ativa && "border-primary bg-primary text-primary-foreground",
                          completa && "border-success bg-success text-success-foreground",
                        )}
                      >
                        {completa ? <Check className="h-4 w-4" /> : item.numero}
                      </span>
                      <span className={cn("truncate text-xs sm:text-sm", ativa ? "font-semibold" : "text-muted-foreground")}>
                        {item.rotulo}
                      </span>
                    </div>
                    {indice < ETAPAS.length - 1 && <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/50" />}
                  </div>
                );
              })}
            </div>
          )}
        </DialogHeader>

        <div className="max-h-[calc(92vh-280px)] overflow-y-auto px-6 py-5">
          {concluido ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="h-9 w-9" />
              </span>
              <h3 className="mt-5 text-xl font-semibold">{tituloConclusao}</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{descricaoConclusao}</p>
              <Button className="mt-6 min-w-36" onClick={fechar}>Concluir</Button>
            </div>
          ) : somenteVisualizar ? (
            <ViewSolicitacao registro={solicitacao} />
          ) : etapa === 1 ? (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold">Confira os dados</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Verifique as informações e o documento antes de tomar uma decisão.
                </p>
              </div>

              <dl className="grid gap-4 rounded-xl border p-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Sociedade</dt>
                  <dd className="mt-1 font-medium">{sociedade?.nome ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Fornecedor</dt>
                  <dd className="mt-1 font-medium">{fornecedor?.nome_fantasia ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Categoria</dt>
                  <dd className="mt-1 font-medium">{categoria?.nome ?? "Sem categoria"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Vencimento</dt>
                  <dd className="mt-1 font-medium">{formatarData(solicitacao.vencimento)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Descrição</dt>
                  <dd className="mt-1 font-medium">{solicitacao.descricao}</dd>
                </div>
                {solicitacao.observacoes && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">Observações</dt>
                    <dd className="mt-1 whitespace-pre-wrap">{solicitacao.observacoes}</dd>
                  </div>
                )}
              </dl>

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Nota fiscal ou documento</p>
                {solicitacao.anexo_nota_url ? (
                  <UploadAnexo
                    sociedadeId={solicitacao.sociedade_id}
                    pasta="solicitacoes-nota"
                    caminho={solicitacao.anexo_nota_url}
                    onChange={() => {}}
                    disabled
                  />
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm text-warning">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Nenhuma nota fiscal foi anexada.
                  </div>
                )}
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-muted/20 p-4">
                <Checkbox
                  checked={conferenciaOk}
                  onCheckedChange={(valor) => setConferenciaOk(Boolean(valor))}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-medium">Conferi os dados e os documentos</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    Confirmo que revisei fornecedor, descrição, valor, vencimento e anexos.
                  </span>
                </span>
              </label>
            </div>
          ) : etapa === 2 ? (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold">Qual é a decisão?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Selecione uma opção. O motivo só será exigido ao devolver ou recusar.
                </p>
              </div>

              <div className="grid gap-3">
                <Opcao
                  selecionada={decisao === "aprovar"}
                  titulo="Aprovar"
                  descricao="Os dados estão corretos e o pagamento pode ser realizado agora ou depois."
                  icone={<CheckCircle2 className="h-5 w-5" />}
                  onClick={() => {
                    setDecisao("aprovar");
                    setMotivo("");
                  }}
                />
                <Opcao
                  selecionada={decisao === "devolver"}
                  titulo="Devolver para correção"
                  descricao="A sociedade poderá ajustar os dados e enviar novamente."
                  icone={<RotateCcw className="h-5 w-5" />}
                  onClick={() => setDecisao("devolver")}
                />
                <Opcao
                  selecionada={decisao === "recusar"}
                  titulo="Recusar"
                  descricao="A solicitação será encerrada e não poderá ser paga."
                  icone={<XCircle className="h-5 w-5" />}
                  onClick={() => setDecisao("recusar")}
                  destrutiva
                />
              </div>

              {(decisao === "devolver" || decisao === "recusar") && (
                <div className="space-y-2 rounded-xl border p-4">
                  <Label htmlFor="motivo-decisao">
                    {decisao === "devolver" ? "O que precisa ser corrigido" : "Motivo da recusa"}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="motivo-decisao"
                    rows={4}
                    value={motivo}
                    onChange={(evento) => setMotivo(evento.target.value)}
                    placeholder={
                      decisao === "devolver"
                        ? "Ex.: anexar nota fiscal, corrigir o valor ou o fornecedor."
                        : "Explique por que esta solicitação está sendo recusada."
                    }
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold">Como deseja concluir?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {jaAprovada
                    ? "A solicitação já está aprovada. Registre os dados da quitação."
                    : "Aprove para pagar depois ou conclua a aprovação e o pagamento agora."}
                </p>
              </div>

              {!jaAprovada && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Opcao
                    selecionada={modoPagamento === "depois"}
                    titulo="Aprovar para pagar depois"
                    descricao="O item ficará na aba Aprovadas, aguardando a quitação."
                    icone={<Clock3 className="h-5 w-5" />}
                    onClick={() => setModoPagamento("depois")}
                  />
                  <Opcao
                    selecionada={modoPagamento === "agora"}
                    titulo="Aprovar e pagar agora"
                    descricao="Informe a data e o comprovante para concluir tudo de uma vez."
                    icone={<Banknote className="h-5 w-5" />}
                    onClick={() => setModoPagamento("agora")}
                  />
                </div>
              )}

              {(modoPagamento === "agora" || jaAprovada) && (
                <div className="space-y-4 rounded-xl border p-4">
                  <div className={cn(
                    "rounded-lg border p-3",
                    saldoNegativo ? "border-warning/40 bg-warning/5" : "bg-muted/25",
                  )}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Wallet className="h-4 w-4" /> Saldo atual
                      </span>
                      <strong>{carregandoSaldo ? "…" : formatarMoeda(saldoAtual)}</strong>
                    </div>
                    {!carregandoSaldo && (
                      <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">Saldo após pagar</span>
                        <strong className={cn(saldoNegativo && "text-warning")}>{formatarMoeda(saldoDepois)}</strong>
                      </div>
                    )}
                    {saldoNegativo && (
                      <p className="mt-2 text-xs text-warning">Este pagamento deixará o saldo da sociedade negativo.</p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="data-pagamento">Data do pagamento</Label>
                      <Input
                        id="data-pagamento"
                        type="date"
                        value={dataPagamento}
                        max={hojeISO()}
                        onChange={(evento) => setDataPagamento(evento.target.value)}
                      />
                      {dataFutura && <p className="text-xs text-destructive">A data não pode estar no futuro.</p>}
                      {mesTravado && <p className="text-xs text-destructive">O mês selecionado já está consolidado.</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Comprovante obrigatório</Label>
                      <UploadAnexo
                        sociedadeId={solicitacao.sociedade_id}
                        pasta="pagamentos"
                        caminho={comprovanteUrl}
                        onChange={setComprovanteUrl}
                        rotulo="Anexar comprovante"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes-pagamento">Observações do pagamento</Label>
                    <Textarea
                      id="observacoes-pagamento"
                      rows={3}
                      value={observacoes}
                      onChange={(evento) => setObservacoes(evento.target.value)}
                      placeholder="Ex.: pagamento realizado por PIX, identificação da transferência..."
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!concluido && (
          <DialogFooter className="flex-row items-center justify-between gap-3 border-t px-6 py-4 sm:justify-between">
            <div>
              {!somenteVisualizar && etapa > 1 && !jaAprovada && (
                <Button
                  variant="ghost"
                  onClick={() => setEtapa((atual) => Math.max(1, atual - 1) as Etapa)}
                  disabled={processar.isPending}
                >
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={fechar} disabled={processar.isPending}>
                {somenteVisualizar ? "Fechar" : "Cancelar"}
              </Button>

              {!somenteVisualizar && etapa === 1 && (
                <Button onClick={() => setEtapa(2)} disabled={!conferenciaOk}>
                  Continuar <ChevronRight className="h-4 w-4" />
                </Button>
              )}

              {!somenteVisualizar && etapa === 2 && decisao === "aprovar" && (
                <Button onClick={() => setEtapa(3)}>
                  Continuar <ChevronRight className="h-4 w-4" />
                </Button>
              )}

              {!somenteVisualizar && etapa === 2 && decisao === "devolver" && (
                <Button
                  variant="outline"
                  onClick={() => executar("devolver")}
                  disabled={!motivo.trim() || processar.isPending}
                >
                  <RotateCcw className="h-4 w-4" />
                  {processar.isPending ? "Devolvendo..." : "Confirmar devolução"}
                </Button>
              )}

              {!somenteVisualizar && etapa === 2 && decisao === "recusar" && (
                <Button
                  variant="destructive"
                  onClick={() => executar("recusar")}
                  disabled={!motivo.trim() || processar.isPending}
                >
                  <XCircle className="h-4 w-4" />
                  {processar.isPending ? "Recusando..." : "Confirmar recusa"}
                </Button>
              )}

              {!somenteVisualizar && etapa === 3 && modoPagamento === "depois" && !jaAprovada && (
                <Button onClick={() => executar("aprovar")} disabled={processar.isPending}>
                  <FileCheck2 className="h-4 w-4" />
                  {processar.isPending ? "Aprovando..." : "Aprovar para pagar depois"}
                </Button>
              )}

              {!somenteVisualizar && etapa === 3 && (modoPagamento === "agora" || jaAprovada) && (
                <Button
                  onClick={() => executar(jaAprovada ? "pagar" : "aprovar_pagar")}
                  disabled={!podeConfirmarPagamento}
                >
                  <Banknote className="h-4 w-4" />
                  {processar.isPending ? "Concluindo..." : jaAprovada ? "Registrar pagamento" : "Aprovar e pagar agora"}
                </Button>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
