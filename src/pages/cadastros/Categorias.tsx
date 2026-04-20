import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { DataTable, Coluna } from "@/components/painel/DataTable";
import { FormDialog } from "@/components/painel/FormDialog";
import { ConfirmDialog } from "@/components/painel/ConfirmDialog";
import { StatusBadge, TipoBadge } from "@/components/painel/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Power } from "lucide-react";
import {
  Categoria,
  useAlternarStatusCategoria,
  useAtualizarCategoria,
  useCategorias,
  useCriarCategoria,
} from "@/hooks/cadastros/useCategorias";

const schema = z.object({
  nome: z.string().trim().min(2, "Mínimo 2 caracteres").max(80),
  tipo: z.enum(["entrada", "saida"]),
});
type FormData = z.infer<typeof schema>;

export default function Categorias() {
  const { data, isLoading } = useCategorias();
  const criar = useCriarCategoria();
  const atualizar = useAtualizarCategoria();
  const alternar = useAlternarStatusCategoria();

  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [confirmando, setConfirmando] = useState<Categoria | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", tipo: "entrada" },
  });

  const abrirNovo = () => {
    setEditando(null);
    form.reset({ nome: "", tipo: "entrada" });
    setAberto(true);
  };
  const abrirEditar = (c: Categoria) => {
    setEditando(c);
    form.reset({ nome: c.nome, tipo: c.tipo });
    setAberto(true);
  };
  const onSubmit = async (v: FormData) => {
    const payload = { nome: v.nome, tipo: v.tipo };
    if (editando) await atualizar.mutateAsync({ id: editando.id, ...payload });
    else await criar.mutateAsync(payload);
    setAberto(false);
  };

  const colunas: Coluna<Categoria>[] = [
    { chave: "nome", cabecalho: "Nome", render: (c) => <span className="font-medium">{c.nome}</span> },
    { chave: "tipo", cabecalho: "Tipo", render: (c) => <TipoBadge tipo={c.tipo} /> },
    { chave: "status", cabecalho: "Status", render: (c) => <StatusBadge ativo={c.ativo} /> },
    {
      chave: "acoes",
      cabecalho: "",
      className: "w-1 text-right",
      render: (c) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => abrirEditar(c)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmando(c)}>
            <Power className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ShellPainel titulo="Categorias" descricao="Categorias de entradas e saídas financeiras.">
      <DataTable
        dados={data ?? []}
        colunas={colunas}
        carregando={isLoading}
        buscaPlaceholder="Buscar por nome..."
        filtrarPor={(c, t) => c.nome.toLowerCase().includes(t) || c.tipo.includes(t)}
        acoes={
          <Button onClick={abrirNovo}>
            <Plus className="h-4 w-4" />
            Nova categoria
          </Button>
        }
      />

      <FormDialog
        open={aberto}
        onOpenChange={setAberto}
        titulo={editando ? "Editar categoria" : "Nova categoria"}
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" {...form.register("nome")} />
            {form.formState.errors.nome && (
              <p className="text-xs text-destructive">{form.formState.errors.nome.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select
              value={form.watch("tipo")}
              onValueChange={(v) => form.setValue("tipo", v as FormData["tipo"], { shouldValidate: true })}
            >
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setAberto(false)}>Cancelar</Button>
            <Button type="submit" disabled={criar.isPending || atualizar.isPending}>
              {editando ? "Salvar alterações" : "Criar"}
            </Button>
          </div>
        </form>
      </FormDialog>

      <ConfirmDialog
        open={!!confirmando}
        onOpenChange={(o) => !o && setConfirmando(null)}
        titulo={confirmando?.ativo ? "Inativar categoria?" : "Reativar categoria?"}
        descricao={`Altera o status de "${confirmando?.nome}".`}
        textoConfirmar={confirmando?.ativo ? "Inativar" : "Reativar"}
        destrutivo={!!confirmando?.ativo}
        onConfirmar={() => {
          if (confirmando) {
            alternar.mutate({ id: confirmando.id, ativo: !confirmando.ativo });
            setConfirmando(null);
          }
        }}
      />
    </ShellPainel>
  );
}
