import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFechamentosCentral } from "@/hooks/fechamentos/useFechamentos";
import { ClipboardCheck, ArrowRight } from "lucide-react";

const NOMES_MES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export function CardFechamentoMesCentral() {
  const { data: fechamentos = [], isLoading } = useFechamentosCentral();
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth() + 1;

  const enviadosTotal = fechamentos.filter((f) => f.status === "enviado").length;
  const conferidosMes = fechamentos.filter(
    (f) => f.status === "conferido" && f.ano === ano && f.mes === mes,
  ).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          Fechamentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Aguardando conferência</p>
                <p className="text-2xl font-semibold text-warning">{enviadosTotal}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Conferidos em {NOMES_MES[mes - 1]}/{ano}
                </p>
                <p className="text-2xl font-semibold text-primary">{conferidosMes}</p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/central/fechamentos">
                Ir para fechamentos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
