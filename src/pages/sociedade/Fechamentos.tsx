import { useState } from "react";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { useSociedadeOperacional } from "@/contexts/SociedadeOperacionalContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, RefreshCw, Send, Eye, Trash2 } from "lucide-react";
import {
  useFechamentosSociedade,
  useEnviarFechamento,
  useRecalcularFechamento,
  useExcluirFechamento,
  type Fechamento,
} from "@/hooks/fechamentos/useFechamentos";
import { StatusFechamentoBadge } from "@/components/fechamentos/StatusFechamentoBadge";
import { ModalNovoFechamento } from "@/components/fechamentos/ModalNovoFechamento";
import { DetalheFechamento } from "@/components/fechamentos/DetalheFechamento";
import { formatarMoeda } from "@/lib/format";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function FechamentosSociedade() {
  const { sociedadeId } = useAuth();
  const { data = [], isLoading } = useFechamentosSociedade(sociedadeId);
  const enviar = useEnviarFechamento();
  const recalcular = useRecalcularFechamento();
  const excluir = useExcluirFechamento();

  const [novoOpen, setNovoOpen] = useState(false);
  const [detalhe, setDetalhe] = useState<Fechamento | null>(null);
  const [paraExcluir, setParaExcluir] = useState<Fechamento | null>(null);

  return (
    <ShellPainel
      titulo="Fechamentos mensais"
      descricao="Crie, recalcule e envie o fechamento do mês para conferência."
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Fechamentos mensais</h2>
          <p className="text-sm text-muted-foreground">
            Resumo do mês a partir das movimentações confirmadas.
          </p>
        </div>
        <Button onClick={() => setNovoOpen(true)} disabled={!sociedadeId} data-tour="novo-fechamento">
          <Plus className="h-4 w-4" />
          Novo fechamento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Saldo inicial</TableHead>
                  <TableHead className="text-right">Entradas</TableHead>
                  <TableHead className="text-right">Saídas</TableHead>
                  <TableHead className="text-right">Saldo final</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                      Nenhum fechamento ainda.
                    </TableCell>
                  </TableRow>
                )}
                {data.map((f) => {
                  const editavel = f.status === "aberto";
                  return (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">
                        {MESES[f.mes - 1]} / {f.ano}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatarMoeda(Number(f.saldo_inicial))}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600">
                        {formatarMoeda(Number(f.total_entradas))}
                      </TableCell>
                      <TableCell className="text-right text-rose-600">
                        {formatarMoeda(Number(f.total_saidas))}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatarMoeda(Number(f.saldo_final))}
                      </TableCell>
                      <TableCell>
                        <StatusFechamentoBadge status={f.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetalhe(f)}
                            title="Detalhe"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {editavel && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => recalcular.mutate(f)}
                                disabled={recalcular.isPending}
                                title="Recalcular"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => enviar.mutate(f)}
                                disabled={enviar.isPending}
                                title="Enviar"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setParaExcluir(f)}
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {sociedadeId && (
        <ModalNovoFechamento
          open={novoOpen}
          onOpenChange={setNovoOpen}
          sociedadeId={sociedadeId}
        />
      )}

      <DetalheFechamento
        open={!!detalhe}
        onOpenChange={(v) => !v && setDetalhe(null)}
        fechamento={detalhe}
      />

      <AlertDialog open={!!paraExcluir} onOpenChange={(v) => !v && setParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fechamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Apenas fechamentos em rascunho podem ser excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (paraExcluir) excluir.mutate(paraExcluir.id);
                setParaExcluir(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ShellPainel>
  );
}
