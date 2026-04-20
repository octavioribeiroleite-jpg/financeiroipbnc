import { useMemo, useState } from "react";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuditoria, RegistroAuditoria } from "@/hooks/igreja/useAuditoria";
import { useUsuariosComPapeis } from "@/hooks/cadastros/useUsuarios";
import { ModalDetalhesAuditoria } from "@/components/igreja/ModalDetalhesAuditoria";

const TODOS = "__todos__";
const POR_PAGINA = 20;

const MODULOS = [
  "sociedades",
  "usuarios",
  "categorias",
  "fornecedores",
  "contribuicoes",
  "solicitacoes_pagamento",
  "movimentacoes_sociedade",
  "fechamentos_mensais",
  "papeis_usuario",
];

const ACOES = ["criacao", "edicao", "exclusao"];

function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR");
}

function badgeAcao(acao: string) {
  if (acao === "criacao") return <Badge variant="secondary">Criação</Badge>;
  if (acao === "edicao") return <Badge>Edição</Badge>;
  if (acao === "exclusao") return <Badge variant="destructive">Exclusão</Badge>;
  return <Badge variant="outline">{acao}</Badge>;
}

export default function IgrejaAuditoria() {
  const [modulo, setModulo] = useState<string>(TODOS);
  const [acao, setAcao] = useState<string>(TODOS);
  const [usuarioId, setUsuarioId] = useState<string>(TODOS);
  const [inicio, setInicio] = useState<string>("");
  const [fim, setFim] = useState<string>("");
  const [pagina, setPagina] = useState(1);
  const [detalhe, setDetalhe] = useState<RegistroAuditoria | null>(null);

  const { data: usuarios = [] } = useUsuariosComPapeis();
  const usuarioMap = useMemo(
    () => new Map(usuarios.map((u) => [u.id, u.nome])),
    [usuarios],
  );

  const { data, isLoading } = useAuditoria({
    modulo: modulo === TODOS ? null : modulo,
    acao: acao === TODOS ? null : acao,
    usuarioId: usuarioId === TODOS ? null : usuarioId,
    inicio: inicio || null,
    fim: fim || null,
    pagina,
    porPagina: POR_PAGINA,
  });

  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / POR_PAGINA)) : 1;

  return (
    <ShellPainel
      titulo="Auditoria"
      descricao="Histórico de criações, edições e exclusões realizadas no sistema."
    >
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Auditoria</h2>
        <p className="text-muted-foreground">
          Histórico de criações, edições e exclusões realizadas no sistema.
        </p>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1">
              <Label>Módulo</Label>
              <Select value={modulo} onValueChange={(v) => { setModulo(v); setPagina(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todos</SelectItem>
                  {MODULOS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Ação</Label>
              <Select value={acao} onValueChange={(v) => { setAcao(v); setPagina(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todas</SelectItem>
                  {ACOES.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Usuário</Label>
              <Select value={usuarioId} onValueChange={(v) => { setUsuarioId(v); setPagina(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todos</SelectItem>
                  {usuarios.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="inicio">Início</Label>
              <Input
                id="inicio"
                type="date"
                value={inicio}
                onChange={(e) => { setInicio(e.target.value); setPagina(1); }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fim">Fim</Label>
              <Input
                id="fim"
                type="date"
                value={fim}
                onChange={(e) => { setFim(e.target.value); setPagina(1); }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && (data?.registros ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {(data?.registros ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">{formatarDataHora(r.data_hora)}</TableCell>
                    <TableCell>{r.usuario_id ? usuarioMap.get(r.usuario_id) ?? "—" : "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{r.modulo}</TableCell>
                    <TableCell>{badgeAcao(r.acao)}</TableCell>
                    <TableCell className="font-mono text-xs">{r.registro_id ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setDetalhe(r)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {data?.total ?? 0} registro(s) — página {pagina} de {totalPaginas}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pagina <= 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ModalDetalhesAuditoria registro={detalhe} onClose={() => setDetalhe(null)} />
    </ShellPainel>
  );
}
