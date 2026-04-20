import { useState, useMemo } from "react";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, CheckCheck, Undo2 } from "lucide-react";
import {
  useFechamentosCentral,
  useConferirFechamento,
  type Fechamento,
} from "@/hooks/fechamentos/useFechamentos";
import { useSociedades } from "@/hooks/cadastros/useSociedades";
import { StatusFechamentoBadge } from "@/components/fechamentos/StatusFechamentoBadge";
import { DetalheFechamento } from "@/components/fechamentos/DetalheFechamento";
import { ModalDevolver } from "@/components/fechamentos/ModalDevolver";
import { formatarMoeda } from "@/lib/format";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function FechamentosCentral() {
  const { data: fechamentos = [], isLoading } = useFechamentosCentral();
  const { data: sociedades = [] } = useSociedades();
  const conferir = useConferirFechamento();

  const [filtroSoc, setFiltroSoc] = useState<string>("todas");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [detalhe, setDetalhe] = useState<Fechamento | null>(null);
  const [devolver, setDevolver] = useState<Fechamento | null>(null);

  const nomeSoc = (id: string) => sociedades.find((s) => s.id === id)?.nome ?? "—";

  const filtrados = useMemo(() => {
    return fechamentos.filter((f) => {
      if (filtroSoc !== "todas" && f.sociedade_id !== filtroSoc) return false;
      if (filtroStatus !== "todos" && f.status !== filtroStatus) return false;
      return true;
    });
  }, [fechamentos, filtroSoc, filtroStatus]);

  return (
    <ShellPainel
      titulo="Conferir fechamentos"
      descricao="Fechamentos enviados pelas sociedades para conferência."
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Sociedade</Label>
          <Select value={filtroSoc} onValueChange={setFiltroSoc}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {sociedades.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="conferido">Conferido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fechamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sociedade</TableHead>
                  <TableHead>Mês</TableHead>
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
                {!isLoading && filtrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                      Nenhum fechamento.
                    </TableCell>
                  </TableRow>
                )}
                {filtrados.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{nomeSoc(f.sociedade_id)}</TableCell>
                    <TableCell>
                      {MESES[f.mes - 1]} / {f.ano}
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
                        {f.status === "enviado" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => conferir.mutate(f)}
                              disabled={conferir.isPending}
                              title="Conferir"
                            >
                              <CheckCheck className="h-4 w-4 text-success" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDevolver(f)}
                              title="Devolver"
                            >
                              <Undo2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DetalheFechamento
        open={!!detalhe}
        onOpenChange={(v) => !v && setDetalhe(null)}
        fechamento={detalhe}
        nomeSociedade={detalhe ? nomeSoc(detalhe.sociedade_id) : undefined}
      />

      <ModalDevolver
        open={!!devolver}
        onOpenChange={(v) => !v && setDevolver(null)}
        fechamento={devolver}
      />
    </ShellPainel>
  );
}
