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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useSociedades } from "@/hooks/cadastros/useSociedades";
import { ViewSolicitacao } from "@/components/sociedade/ViewSolicitacao";
import {
  useAprovarSolicitacao,
  useRecusarSolicitacao,
  useDevolverSolicitacao,
  useIniciarAnalise,
  type Solicitacao,
} from "@/hooks/central/useSolicitacoesCentral";
import { CheckCircle2, XCircle, Undo2, Search } from "lucide-react";

interface Props {
  solicitacao: Solicitacao | null;
  open: boolean;
  onClose: () => void;
}

export function ModalAnalisarSolicitacao({ solicitacao, open, onClose }: Props) {
  const { user } = useAuth();
  const { data: sociedades } = useSociedades();
  const iniciar = useIniciarAnalise();
  const aprovar = useAprovarSolicitacao();
  const recusar = useRecusarSolicitacao();
  const devolver = useDevolverSolicitacao();

  const [docOk, setDocOk] = useState(false);
  const [valorOk, setValorOk] = useState(false);
  const [motivoRecusa, setMotivoRecusa] = useState("");
  const [obsDevolucao, setObsDevolucao] = useState("");

  const sociedade = sociedades?.find((s) => s.id === solicitacao?.sociedade_id);

  const reset = () => {
    setDocOk(false);
    setValorOk(false);
    setMotivoRecusa("");
    setObsDevolucao("");
  };

  const fechar = () => {
    reset();
    onClose();
  };

  if (!solicitacao || !user) return null;

  const podeIniciar = solicitacao.status === "enviada";
  const podeAgir = solicitacao.status === "em_analise";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && fechar()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Análise da solicitação</DialogTitle>
          <DialogDescription>
            {sociedade?.nome ?? "—"} · {solicitacao.descricao}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="visualizar">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="visualizar">Detalhes</TabsTrigger>
            <TabsTrigger value="aprovar" disabled={!podeAgir}>
              Aprovar
            </TabsTrigger>
            <TabsTrigger value="recusar" disabled={!podeAgir}>
              Recusar
            </TabsTrigger>
            <TabsTrigger value="devolver" disabled={!podeAgir}>
              Devolver
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visualizar" className="space-y-3">
            <ViewSolicitacao registro={solicitacao} />
            {podeIniciar && (
              <>
                <Separator />
                <Button
                  className="w-full"
                  onClick={() =>
                    iniciar.mutate(
                      { id: solicitacao.id, conferidoPor: user.id },
                      { onSuccess: fechar },
                    )
                  }
                  disabled={iniciar.isPending}
                >
                  <Search className="h-4 w-4" />
                  Iniciar análise
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="aprovar" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Confirme as validações abaixo para aprovar a solicitação.
            </p>
            <div className="flex items-start gap-2">
              <Checkbox id="ap-doc" checked={docOk} onCheckedChange={(v) => setDocOk(!!v)} />
              <Label htmlFor="ap-doc" className="text-sm font-normal">
                Documentação completa
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox id="ap-val" checked={valorOk} onCheckedChange={(v) => setValorOk(!!v)} />
              <Label htmlFor="ap-val" className="text-sm font-normal">
                Valores conferidos
              </Label>
            </div>
            <Button
              className="w-full"
              onClick={() =>
                aprovar.mutate(
                  { id: solicitacao.id, conferidoPor: user.id },
                  { onSuccess: fechar },
                )
              }
              disabled={!docOk || !valorOk || aprovar.isPending}
            >
              <CheckCircle2 className="h-4 w-4" />
              Aprovar solicitação
            </Button>
          </TabsContent>

          <TabsContent value="recusar" className="space-y-3">
            <Label htmlFor="motivo" className="text-sm">
              Motivo da recusa <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="motivo"
              rows={4}
              value={motivoRecusa}
              onChange={(e) => setMotivoRecusa(e.target.value)}
              placeholder="Explique por que a solicitação foi recusada"
            />
            <Button
              variant="destructive"
              className="w-full"
              onClick={() =>
                recusar.mutate(
                  { id: solicitacao.id, motivo: motivoRecusa.trim(), conferidoPor: user.id },
                  { onSuccess: fechar },
                )
              }
              disabled={!motivoRecusa.trim() || recusar.isPending}
            >
              <XCircle className="h-4 w-4" />
              Recusar solicitação
            </Button>
          </TabsContent>

          <TabsContent value="devolver" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              A solicitação volta para "rascunho" e a sociedade poderá editá-la.
            </p>
            <Label htmlFor="ajuste" className="text-sm">
              O que precisa ser ajustado <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="ajuste"
              rows={4}
              value={obsDevolucao}
              onChange={(e) => setObsDevolucao(e.target.value)}
              placeholder="Ex.: anexar nota fiscal, corrigir valor, etc."
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                devolver.mutate(
                  { id: solicitacao.id, observacao: obsDevolucao.trim(), conferidoPor: user.id },
                  { onSuccess: fechar },
                )
              }
              disabled={!obsDevolucao.trim() || devolver.isPending}
            >
              <Undo2 className="h-4 w-4" />
              Devolver para ajuste
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={fechar}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
