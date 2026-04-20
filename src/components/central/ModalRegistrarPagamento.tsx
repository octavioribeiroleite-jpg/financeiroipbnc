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
import { AvisoMesConsolidado } from "@/components/fechamentos/AvisoMesConsolidado";
import { Banknote } from "lucide-react";

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

  if (!solicitacao || !user) return null;

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
    if (!comprovanteUrl) return;
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
          <div className="space-y-1">
            <Label htmlFor="data" className="text-xs">
              Data do pagamento <span className="text-destructive">*</span>
            </Label>
            <Input
              id="data"
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
            />
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={fechar}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={!comprovanteUrl || !dataPagamento || registrar.isPending || !!travado}
          >
            <Banknote className="h-4 w-4" />
            Confirmar pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
