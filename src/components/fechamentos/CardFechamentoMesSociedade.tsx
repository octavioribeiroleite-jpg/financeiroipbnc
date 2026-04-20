import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusFechamentoBadge } from "@/components/fechamentos/StatusFechamentoBadge";
import { ModalNovoFechamento } from "@/components/fechamentos/ModalNovoFechamento";
import { DetalheFechamento } from "@/components/fechamentos/DetalheFechamento";
import {
  useEnviarFechamento,
  useFechamentosSociedade,
  useRecalcularFechamento,
} from "@/hooks/fechamentos/useFechamentos";
import { formatarMoeda } from "@/lib/format";
import { CalendarCheck, Plus, RefreshCw, Send, Eye } from "lucide-react";

interface Props {
  sociedadeId: string;
}

const NOMES_MES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function CardFechamentoMesSociedade({ sociedadeId }: Props) {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth() + 1;

  const { data: fechamentos = [], isLoading } = useFechamentosSociedade(sociedadeId);
  const recalcular = useRecalcularFechamento();
  const enviar = useEnviarFechamento();

  const [criando, setCriando] = useState(false);
  const [verId, setVerId] = useState<string | null>(null);

  const fechamentoMes = useMemo(
    () => fechamentos.find((f) => f.ano === ano && f.mes === mes) ?? null,
    [fechamentos, ano, mes],
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarCheck className="h-4 w-4 text-primary" />
            Fechamento de {NOMES_MES[mes - 1]}/{ano}
          </CardTitle>
          {fechamentoMes && <StatusFechamentoBadge status={fechamentoMes.status} />}
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : !fechamentoMes ? (
            <>
              <p className="text-sm text-muted-foreground">
                Nenhum fechamento criado para este mês ainda.
              </p>
              <Button size="sm" onClick={() => setCriando(true)}>
                <Plus className="h-4 w-4" />
                Criar fechamento
              </Button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Entradas</p>
                  <p className="font-medium text-success">
                    {formatarMoeda(Number(fechamentoMes.total_entradas))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saídas</p>
                  <p className="font-medium text-destructive">
                    {formatarMoeda(Number(fechamentoMes.total_saidas))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo final</p>
                  <p className="font-semibold">
                    {formatarMoeda(Number(fechamentoMes.saldo_final))}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => setVerId(fechamentoMes.id)}>
                  <Eye className="h-4 w-4" />
                  Ver detalhes
                </Button>
                {fechamentoMes.status === "aberto" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => recalcular.mutate(fechamentoMes)}
                      disabled={recalcular.isPending}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Recalcular
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => enviar.mutate(fechamentoMes)}
                      disabled={enviar.isPending}
                    >
                      <Send className="h-4 w-4" />
                      Enviar
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ModalNovoFechamento open={criando} onOpenChange={setCriando} sociedadeId={sociedadeId} />
      <DetalheFechamento id={verId} onClose={() => setVerId(null)} podeConferir={false} />
    </>
  );
}
