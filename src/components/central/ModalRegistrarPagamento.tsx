import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UploadAnexo } from "@/components/shared/UploadAnexo";
import { useAuth } from "@/contexts/AuthContext";
import { useRegistrarPagamento, type Solicitacao } from "@/hooks/central/useSolicitacoesCentral";
import { hojeISO, formatarMoeda } from "@/lib/format";
import { useMesConsolidado } from "@/hooks/fechamentos/useMesConsolidado";
import { useResumoSociedade } from "@/hooks/sociedade/useResumoSociedade";
import { AvisoMesConsolidado } from "@/components/fechamentos/AvisoMesConsolidado";
import { AlertCircle, Banknote, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  solicitacao: Solicitacao | null;
  open: boolean;
  onClose: () => void;
}

export function ModalRegistrarPagamento({ solicitacao, open, onClose }: Props) {
  const { user } = useAuth();
  const registrar = useRegistrarPagamento();

  const [dataPagamento, setDataPagamento] = useState(hojeISO());
  const [comprovanteUrl, setComprovanteUrl] = useState<string | null>(null);
  const [observacoes, setObservacoes] = useState("");

  const { data: travado } = useMesConsolidado(
    solicitacao?.sociedade_id ?? null,
    dataPagamento,
  );
  const { data: resumo, isLoading: carregandoSaldo } = useResumoSociedade(
    solicitacao?.sociedade_id ?? null,
  );

  if (!solicitacao || !user) return null;

  const dataFutura = dataPagamento > hojeISO();
  const statusAlterado = solicitacao.status !== "aprovada";
  const saldoAtual = resumo?.saldoAtual ?? 0;
  const saldoDepois = saldoAtual - Number(solicitacao.valor);
  const saldoInsuficiente = !carregandoSaldo && saldoDepois < 0;

  const reset = () => {
    setDataPagamento(hojeISO());
    setComprovanteUrl(null);
    setObservacoes("");
  };

  const fechar = () => {
    reset();
    onClose();
  };

  const handleConfirmar = () => {
    if (!comprovanteUrl || dataFutura || statusAlterado || travado) return;
    registrar.mutate(
      {
        id: solicitacao.id,
        dataPagamento,
        comprovanteUrl,
        pagoPor: user.id,
        observacoes: observacoes.trim()
          ? `${solicitacao.observacoes ? solicitacao.observacoes + "\n— " : ""}${observacoes.trim()}`
          : solicitacao.observacoes,
      },
      { onSuccess: fechar },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && fechar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
          <DialogDescription>
            {solicitacao.descricao} · {formatarMoeda(Number(solicitacao.valor))}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <AvisoMesConsolidado
            visivel={!!travado}
            mensagem="A data informada cai em um mês já consolidado. Escolha outra data para registrar o pagamento."
          />

          {statusAlterado && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Esta solicitação não está mais aprovada. Feche a janela e atualize a fila.</p>
            </div>
          )}

          <div className={cn(
            "rounded-lg border p-3",
            saldoInsuficiente ? "border-warning/40 bg-warning/5" : "bg-muted/30",
          )}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4" />
                Saldo atual da sociedade
              </div>
              <span className="font-semibold">{carregandoSaldo ? "…" : formatarMoeda(saldoAtual)}</span>
            </div>
            {!carregandoSaldo && (
              <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Saldo após o pagamento</span>
                <span className={cn("font-semibold", saldoDepois < 0 && "text-warning")}>
                  {formatarMoeda(saldoDepois)}
                </span>
              </div>
            )}
            {saldoInsuficiente && (
              <p className="mt-2 text-xs text-warning">
                Atenção: este pagamento deixará o cofrinho da sociedade com saldo negativo.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="data" className="text-xs">
              Data do pagamento <span className="text-destructive">*</span>
            </Label>
            <Input
              id="data"
              type="date"
              value={dataPagamento}
              max={hojeISO()}
              onChange={(e) => setDataPagamento(e.target.value)}
            />
            {dataFutura && <p className="text-xs text-destructive">A data do pagamento não pode estar no futuro.</p>}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">
              Comprovante <span className="text-destructive">*</span>
            </Label>
            <UploadAnexo
              sociedadeId={solicitacao.sociedade_id}
              pasta="pagamentos"
              caminho={comprovanteUrl}
              onChange={setComprovanteUrl}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="obs-pag" className="text-xs">
              Observações do pagamento
            </Label>
            <Textarea
              id="obs-pag"
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex.: PIX para chave xxx, transferência feita pelo banco X..."
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Ao confirmar, a solicitação será marcada como paga e a saída será lançada no extrato da sociedade.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={fechar} disabled={registrar.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={
              !comprovanteUrl ||
              !dataPagamento ||
              dataFutura ||
              statusAlterado ||
              registrar.isPending ||
              !!travado
            }
          >
            <Banknote className="h-4 w-4" />
            {registrar.isPending ? "Registrando..." : "Confirmar pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
