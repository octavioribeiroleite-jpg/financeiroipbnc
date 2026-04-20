import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFechamentosIgreja, useConsolidarMes } from "@/hooks/fechamentos/useFechamentos";
import { useSociedades } from "@/hooks/cadastros/useSociedades";
import { Layers, ArrowRight, CheckCircle2 } from "lucide-react";

const NOMES_MES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function CardConsolidacaoIgreja() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth() + 1;

  const { data: fechamentos = [], isLoading } = useFechamentosIgreja(ano, mes);
  const { data: sociedades = [] } = useSociedades();
  const consolidar = useConsolidarMes();

  const ativas = sociedades.filter((s) => s.status === "ativa");
  const totalAtivas = ativas.length;

  const consolidadas = fechamentos.filter((f) => f.status === "consolidado").length;
  const conferidas = fechamentos.filter((f) => f.status === "conferido").length;
  const pendentes = totalAtivas - consolidadas - conferidas;

  const podeConsolidar =
    totalAtivas > 0 && conferidas > 0 && consolidadas + conferidas === totalAtivas;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-4 w-4 text-primary" />
          Consolidação de {NOMES_MES[mes - 1]}/{ano}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Consolidadas</p>
                <p className="text-xl font-semibold text-success">{consolidadas}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Conferidas</p>
                <p className="text-xl font-semibold text-primary">{conferidas}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-xl font-semibold text-muted-foreground">
                  {Math.max(0, pendentes)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                disabled={!podeConsolidar || consolidar.isPending}
                onClick={() => consolidar.mutate({ ano, mes })}
              >
                <CheckCircle2 className="h-4 w-4" />
                Consolidar mês
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/igreja/fechamentos">
                  Abrir consolidação
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
