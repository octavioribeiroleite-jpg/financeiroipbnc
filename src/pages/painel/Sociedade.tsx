import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { CardResumo } from "@/components/sociedade/ResumoFinanceiro";
import { StatusContribuicaoBadge } from "@/components/sociedade/StatusContribuicaoBadge";
import { StatusSolicitacaoBadge } from "@/components/sociedade/StatusSolicitacaoBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  FileText,
  HandCoins,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useResumoSociedade } from "@/hooks/sociedade/useResumoSociedade";
import { useContribuicoesSociedade } from "@/hooks/sociedade/useContribuicoesSociedade";
import { useSolicitacoesSociedade } from "@/hooks/sociedade/useSolicitacoesSociedade";
import { formatarData, formatarMoeda } from "@/lib/format";
import { useSociedades } from "@/hooks/cadastros/useSociedades";

export default function PainelSociedade() {
  const { perfil, sociedadeId } = useAuth();
  const { data: sociedades } = useSociedades();
  const { data: resumo, isLoading: carregandoResumo } = useResumoSociedade(sociedadeId);
  const { data: contribuicoes } = useContribuicoesSociedade(sociedadeId);
  const { data: solicitacoes } = useSolicitacoesSociedade(sociedadeId);

  const sociedade = useMemo(
    () => sociedades?.find((s) => s.id === sociedadeId) ?? null,
    [sociedades, sociedadeId],
  );

  const ultContribuicoes = (contribuicoes ?? []).slice(0, 5);
  const ultSolicitacoes = (solicitacoes ?? []).slice(0, 5);

  if (!sociedadeId) {
    return (
      <ShellPainel
        titulo="Painel da Sociedade"
        descricao="Sua conta ainda não está vinculada a uma sociedade."
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acesso bloqueado</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Olá{perfil?.nome ? `, ${perfil.nome}` : ""}. Solicite ao administrador o vínculo da sua
            conta a uma sociedade para começar a registrar contribuições e solicitações.
          </CardContent>
        </Card>
      </ShellPainel>
    );
  }

  return (
    <ShellPainel
      titulo={sociedade ? `Painel — ${sociedade.nome}` : "Painel da Sociedade"}
      descricao={
        sociedade ? `${sociedade.tipo} · Visão financeira do mês corrente` : "Resumo financeiro"
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CardResumo
          titulo="Saldo atual"
          valor={carregandoResumo ? "…" : formatarMoeda(resumo?.saldoAtual ?? 0)}
          descricao="Entradas − saídas confirmadas"
          icone={<Wallet className="h-5 w-5" />}
          cor={(resumo?.saldoAtual ?? 0) >= 0 ? "success" : "destructive"}
        />
        <CardResumo
          titulo="Contribuições do mês"
          valor={carregandoResumo ? "…" : formatarMoeda(resumo?.contribuicoesMes ?? 0)}
          icone={<ArrowUpCircle className="h-5 w-5" />}
          cor="success"
        />
        <CardResumo
          titulo="Pagamentos do mês"
          valor={carregandoResumo ? "…" : formatarMoeda(resumo?.pagamentosMes ?? 0)}
          icone={<ArrowDownCircle className="h-5 w-5" />}
          cor="destructive"
        />
        <CardResumo
          titulo="Rascunhos pendentes"
          valor={carregandoResumo ? "…" : String(resumo?.solicitacoesPendentes ?? 0)}
          descricao="Solicitações não enviadas"
          icone={<Clock className="h-5 w-5" />}
          cor="warning"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/sociedade/contribuicoes">
            <HandCoins className="h-4 w-4" />
            Nova contribuição
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/sociedade/solicitacoes">
            <FileText className="h-4 w-4" />
            Nova solicitação
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Últimas contribuições</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/sociedade/contribuicoes">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membro</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ultContribuicoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-20 text-center text-sm text-muted-foreground">
                      Nenhuma contribuição registrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  ultContribuicoes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.membro_nome}</TableCell>
                      <TableCell>{formatarMoeda(Number(c.valor))}</TableCell>
                      <TableCell>{formatarData(c.data_pagamento)}</TableCell>
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
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Últimas solicitações</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/sociedade/solicitacoes">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ultSolicitacoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-20 text-center text-sm text-muted-foreground">
                      Nenhuma solicitação criada.
                    </TableCell>
                  </TableRow>
                ) : (
                  ultSolicitacoes.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="max-w-[180px] truncate font-medium">
                        {s.descricao}
                      </TableCell>
                      <TableCell>{formatarMoeda(Number(s.valor))}</TableCell>
                      <TableCell>{formatarData(s.vencimento)}</TableCell>
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
    </ShellPainel>
  );
}
