import { useMemo } from "react";
import { Link } from "react-router-dom";
import { LayoutAutenticado } from "@/components/LayoutAutenticado";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useContribuicoesCentral } from "@/hooks/central/useContribuicoesCentral";
import { useSolicitacoesCentral } from "@/hooks/central/useSolicitacoesCentral";
import { useSociedades } from "@/hooks/cadastros/useSociedades";
import { useFornecedores } from "@/hooks/cadastros/useFornecedores";
import { CardResumo } from "@/components/sociedade/ResumoFinanceiro";
import { StatusContribuicaoBadge } from "@/components/sociedade/StatusContribuicaoBadge";
import { StatusSolicitacaoBadge } from "@/components/sociedade/StatusSolicitacaoBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatarData, formatarMoeda } from "@/lib/format";
import { CheckCheck, ClipboardCheck, Banknote, AlertTriangle } from "lucide-react";

export default function PainelCentral() {
  const { data: contribuicoes = [] } = useContribuicoesCentral();
  const { data: solicitacoes = [] } = useSolicitacoesCentral();
  const { data: sociedades = [] } = useSociedades();
  const { data: fornecedores = [] } = useFornecedores();

  const totais = useMemo(() => {
    const pendentesConf = contribuicoes.filter((c) => c.status_conferencia === "pendente");
    const divergentes = contribuicoes.filter((c) => c.status_conferencia === "divergente");
    const aguardandoAnalise = solicitacoes.filter((s) => s.status === "enviada");
    const aprovadas = solicitacoes.filter((s) => s.status === "aprovada");
    return {
      qtdContribPendentes: pendentesConf.length,
      qtdDivergentes: divergentes.length,
      qtdAguardando: aguardandoAnalise.length,
      qtdAprovadas: aprovadas.length,
      valorAprovadas: aprovadas.reduce((s, x) => s + Number(x.valor), 0),
    };
  }, [contribuicoes, solicitacoes]);

  const ultimasContribuicoes = contribuicoes.slice(0, 5);
  const ultimasSolicitacoes = solicitacoes
    .filter((s) => s.status !== "rascunho")
    .slice(0, 5);

  const nomeSoc = (id: string) => sociedades.find((s) => s.id === id)?.nome ?? "—";
  const nomeForn = (id: string) => fornecedores.find((f) => f.id === id)?.nome_fantasia ?? "—";

  return (
    <LayoutAutenticado>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Painel da Tesouraria Central</h2>
        <p className="text-muted-foreground">Conferência, análise e pagamentos.</p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CardResumo
          titulo="Contribuições pendentes"
          valor={String(totais.qtdContribPendentes)}
          descricao="Aguardando conferência"
          icone={<CheckCheck className="h-5 w-5" />}
          cor="warning"
        />
        <CardResumo
          titulo="Divergências"
          valor={String(totais.qtdDivergentes)}
          descricao="Requer atenção"
          icone={<AlertTriangle className="h-5 w-5" />}
          cor="destructive"
        />
        <CardResumo
          titulo="Solicitações enviadas"
          valor={String(totais.qtdAguardando)}
          descricao="Aguardando análise"
          icone={<ClipboardCheck className="h-5 w-5" />}
          cor="primary"
        />
        <CardResumo
          titulo="A pagar"
          valor={formatarMoeda(totais.valorAprovadas)}
          descricao={`${totais.qtdAprovadas} aprovada(s)`}
          icone={<Banknote className="h-5 w-5" />}
          cor="success"
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/central/contribuicoes">
            <CheckCheck className="h-4 w-4" />
            Conferir contribuições
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/central/solicitacoes">
            <ClipboardCheck className="h-4 w-4" />
            Analisar solicitações
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Últimas contribuições</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/central/contribuicoes">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sociedade</TableHead>
                  <TableHead>Membro</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ultimasContribuicoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                      Nenhuma contribuição.
                    </TableCell>
                  </TableRow>
                ) : (
                  ultimasContribuicoes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm">{nomeSoc(c.sociedade_id)}</TableCell>
                      <TableCell className="text-sm">{c.membro_nome}</TableCell>
                      <TableCell className="text-sm">{formatarMoeda(Number(c.valor))}</TableCell>
                      <TableCell>
                        <StatusContribuicaoBadge status={c.status_conferencia} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Últimas solicitações</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/central/solicitacoes">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sociedade</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vence</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ultimasSolicitacoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      Nenhuma solicitação.
                    </TableCell>
                  </TableRow>
                ) : (
                  ultimasSolicitacoes.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm">{nomeSoc(s.sociedade_id)}</TableCell>
                      <TableCell className="text-sm">{nomeForn(s.fornecedor_id)}</TableCell>
                      <TableCell className="text-sm">{formatarMoeda(Number(s.valor))}</TableCell>
                      <TableCell className="text-sm">{formatarData(s.vencimento)}</TableCell>
                      <TableCell>
                        <StatusSolicitacaoBadge status={s.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </LayoutAutenticado>
  );
}
