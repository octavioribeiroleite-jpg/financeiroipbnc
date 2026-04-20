import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { DataTable, Coluna } from "@/components/painel/DataTable";
import { FormDialog } from "@/components/painel/FormDialog";
import { ConfirmDialog } from "@/components/painel/ConfirmDialog";
import { StatusBadge } from "@/components/painel/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Power } from "lucide-react";
import {
  Fornecedor,
  useAlternarStatusFornecedor,
  useAtualizarFornecedor,
  useCriarFornecedor,
  useFornecedores,
} from "@/hooks/cadastros/useFornecedores";
import { useCategorias } from "@/hooks/cadastros/useCategorias";

const cnpjRegex = /^(\d{14}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$/;

const schema = z.object({
  nome_fantasia: z.string().trim().min(2, "Mínimo 2 caracteres").max(120),
  razao_social: z.string().trim().max(160).optional().or(z.literal("")),
  cnpj: z
    .string()
    .trim()
    .max(18)
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || cnpjRegex.test(v), "CNPJ inválido (use 14 dígitos ou 00.000.000/0000-00)"),
  categoria_id: z.string().optional().or(z.literal("")),
  banco: z.string().trim().max(80).optional().or(z.literal("")),
  chave_pix: z.string().trim().max(120).optional().or(z.literal("")),
  observacoes: z.string().trim().max(500).optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

const NENHUMA = "__nenhuma__";

export default function Fornecedores() {
  const { data, isLoading } = useFornecedores();
  const { data: categorias } = useCategorias();
  const criar = useCriarFornecedor();
  const atualizar = useAtualizarFornecedor();
  const alternar = useAlternarStatusFornecedor();

  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Fornecedor | null>(null);
  const [confirmando, setConfirmando] = useState<Fornecedor | null>(null);

  const categoriasSaida = (categorias ?? []).filter((c) => c.tipo === "saida" && c.ativo);
  const nomeCategoria = (id: string | null) =>
    (categorias ?? []).find((c) => c.id === id)?.nome ?? "—";

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome_fantasia: "",
      razao_social: "",
      cnpj: "",
      categoria_id: "",
      banco: "",
      chave_pix: "",
      observacoes: "",
    },
  });

  const abrirNovo = () => {
    setEditando(null);
    form.reset({
      nome_fantasia: "",
      razao_social: "",
      cnpj: "",
      categoria_id: "",
      banco: "",
      chave_pix: "",
      observacoes: "",
    });
    setAberto(true);
  };
  const abrirEditar = (f: Fornecedor) => {
    setEditando(f);
    form.reset({
      nome_fantasia: f.nome_fantasia,
      razao_social: f.razao_social ?? "",
      cnpj: f.cnpj ?? "",
      categoria_id: f.categoria_id ?? "",
      banco: f.banco ?? "",
      chave_pix: f.chave_pix ?? "",
      observacoes: f.observacoes ?? "",
    });
    setAberto(true);
  };

  const onSubmit = async (v: FormData) => {
    const payload = {
      nome_fantasia: v.nome_fantasia,
      razao_social: v.razao_social || null,
      cnpj: v.cnpj || null,
      categoria_id: v.categoria_id || null,
      banco: v.banco || null,
      chave_pix: v.chave_pix || null,
      observacoes: v.observacoes || null,
    };
    if (editando) await atualizar.mutateAsync({ id: editando.id, ...payload });
    else await criar.mutateAsync(payload);
    setAberto(false);
  };

  const colunas: Coluna<Fornecedor>[] = [
    { chave: "nome", cabecalho: "Nome fantasia", render: (f) => <span className="font-medium">{f.nome_fantasia}</span> },
    { chave: "cnpj", cabecalho: "CNPJ", render: (f) => f.cnpj ?? "—" },
    { chave: "categoria", cabecalho: "Categoria", render: (f) => nomeCategoria(f.categoria_id) },
    { chave: "status", cabecalho: "Status", render: (f) => <StatusBadge ativo={f.ativo} /> },
    {
      chave: "acoes",
      cabecalho: "",
      className: "w-1 text-right",
      render: (f) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => abrirEditar(f)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmando(f)}>
            <Power className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const categoriaSel = form.watch("categoria_id") || NENHUMA;

  return (
    <ShellPainel titulo="Fornecedores" descricao="Cadastro de fornecedores e prestadores.">
      <DataTable
        dados={data ?? []}
        colunas={colunas}
        carregando={isLoading}
        buscaPlaceholder="Buscar por nome ou CNPJ..."
        filtrarPor={(f, t) =>
          f.nome_fantasia.toLowerCase().includes(t) ||
          (f.razao_social ?? "").toLowerCase().includes(t) ||
          (f.cnpj ?? "").toLowerCase().includes(t)
        }
        acoes={
          <Button onClick={abrirNovo}>
            <Plus className="h-4 w-4" />
            Novo fornecedor
          </Button>
        }
      />

      <FormDialog
        open={aberto}
        onOpenChange={setAberto}
        titulo={editando ? "Editar fornecedor" : "Novo fornecedor"}
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome_fantasia">Nome fantasia *</Label>
            <Input id="nome_fantasia" {...form.register("nome_fantasia")} />
            {form.formState.errors.nome_fantasia && (
              <p className="text-xs text-destructive">{form.formState.errors.nome_fantasia.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="razao_social">Razão social</Label>
            <Input id="razao_social" {...form.register("razao_social")} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" placeholder="00.000.000/0000-00" {...form.register("cnpj")} />
              {form.formState.errors.cnpj && (
                <p className="text-xs text-destructive">{form.formState.errors.cnpj.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria_id">Categoria padrão</Label>
              <Select
                value={categoriaSel}
                onValueChange={(v) => form.setValue("categoria_id", v === NENHUMA ? "" : v)}
              >
                <SelectTrigger id="categoria_id">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NENHUMA}>Nenhuma</SelectItem>
                  {categoriasSaida.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="banco">Banco</Label>
              <Input id="banco" {...form.register("banco")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chave_pix">Chave PIX</Label>
              <Input id="chave_pix" {...form.register("chave_pix")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" rows={3} {...form.register("observacoes")} />
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
        titulo={confirmando?.ativo ? "Inativar fornecedor?" : "Reativar fornecedor?"}
        descricao={`Altera o status de "${confirmando?.nome_fantasia}".`}
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
