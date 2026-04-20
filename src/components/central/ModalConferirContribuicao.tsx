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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useConferirContribuicao, type Contribuicao } from "@/hooks/central/useContribuicoesCentral";
import { useSociedades } from "@/hooks/cadastros/useSociedades";
import { formatarData, formatarMesAno, formatarMoeda } from "@/lib/format";
import { UploadAnexo } from "@/components/shared/UploadAnexo";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface Props {
  contribuicao: Contribuicao | null;
  open: boolean;
  onClose: () => void;
}

export function ModalConferirContribuicao({ contribuicao, open, onClose }: Props) {
  const { user } = useAuth();
  const { data: sociedades } = useSociedades();
  const conferir = useConferirContribuicao();

  const [valoresOk, setValoresOk] = useState(false);
  const [comprovanteOk, setComprovanteOk] = useState(false);
  const [referenciaOk, setReferenciaOk] = useState(false);
  const [observacao, setObservacao] = useState("");

  const sociedade = sociedades?.find((s) => s.id === contribuicao?.sociedade_id);
  const podeConferir = valoresOk && referenciaOk;

  const reset = () => {
    setValoresOk(false);
    setComprovanteOk(false);
    setReferenciaOk(false);
    setObservacao("");
  };

  const handleConferir = (status: "conferida" | "divergente") => {
    if (!contribuicao || !user) return;
    if (status === "divergente" && !observacao.trim()) {
      return;
    }
    conferir.mutate(
      {
        id: contribuicao.id,
        status,
        observacao: observacao.trim() || contribuicao.observacao,
        conferidoPor: user.id,
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!contribuicao) return null;
  const somenteVisualizar = contribuicao.status_conferencia !== "pendente";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {somenteVisualizar ? "Detalhes da contribuição" : "Conferir contribuição"}
          </DialogTitle>
          <DialogDescription>
            {sociedade?.nome ?? "—"} · {contribuicao.membro_nome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Mês de referência</dt>
              <dd className="font-medium">{formatarMesAno(contribuicao.referencia_mes)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Valor</dt>
              <dd className="font-medium">{formatarMoeda(Number(contribuicao.valor))}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Data de pagamento</dt>
              <dd className="font-medium">{formatarData(contribuicao.data_pagamento)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Forma</dt>
              <dd className="font-medium">{contribuicao.forma_pagamento}</dd>
            </div>
            {contribuicao.observacao && (
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Observação</dt>
                <dd className="text-sm">{contribuicao.observacao}</dd>
              </div>
            )}
          </dl>

          {contribuicao.comprovante_url && (
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Comprovante</p>
              <UploadAnexo
                sociedadeId={contribuicao.sociedade_id}
                pasta="contribuicoes"
                caminho={contribuicao.comprovante_url}
                onChange={() => {}}
                disabled
              />
            </div>
          )}

          {!somenteVisualizar && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Checklist de conferência</p>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="valores"
                    checked={valoresOk}
                    onCheckedChange={(v) => setValoresOk(!!v)}
                  />
                  <Label htmlFor="valores" className="text-sm font-normal leading-tight">
                    Valores conferidos
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="comprovante"
                    checked={comprovanteOk}
                    onCheckedChange={(v) => setComprovanteOk(!!v)}
                  />
                  <Label htmlFor="comprovante" className="text-sm font-normal leading-tight">
                    Comprovante válido (quando aplicável)
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="referencia"
                    checked={referenciaOk}
                    onCheckedChange={(v) => setReferenciaOk(!!v)}
                  />
                  <Label htmlFor="referencia" className="text-sm font-normal leading-tight">
                    Referência (mês) correta
                  </Label>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="obs" className="text-xs">
                  Observação (obrigatória se divergente)
                </Label>
                <Textarea
                  id="obs"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={3}
                  placeholder="Ex.: valor diverge do informado no comprovante"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
          {!somenteVisualizar && (
            <>
              <Button
                variant="destructive"
                onClick={() => handleConferir("divergente")}
                disabled={conferir.isPending || !observacao.trim()}
              >
                <AlertTriangle className="h-4 w-4" />
                Marcar divergente
              </Button>
              <Button
                onClick={() => handleConferir("conferida")}
                disabled={!podeConferir || conferir.isPending}
              >
                <CheckCircle2 className="h-4 w-4" />
                Conferir
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
