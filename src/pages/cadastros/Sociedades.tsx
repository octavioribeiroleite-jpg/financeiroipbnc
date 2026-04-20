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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Power } from "lucide-react";
import {
  Sociedade,
  useAlternarStatusSociedade,
  useAtualizarSociedade,
  useCriarSociedade,
  useSociedades,
} from "@/hooks/cadastros/useSociedades";

const TIPOS = ["UCP", "UMP", "UPH", "UPA", "SAF", "Outra"] as const;

const schema = z.object({
  nome: z.string().trim().min(2, "Mínimo 2 caracteres").max(120),
  tipo: z.enum(TIPOS),
});
type FormData = z.infer<typeof schema>;

export default function Sociedades() {
  const { data, isLoading } = useSociedades();
  const criar = useCriarSociedade();
  const atualizar = useAtualizarSociedade();
  const alternar = useAlternarStatusSociedade();

  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Sociedade | null>(null);
  const [confirmando, setConfirmando] = useState<Sociedade | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", tipo: "UCP" },
  });

  const abrirNovo = () => {
    setEditando(null);
    form.reset({ nome: "", tipo: "UCP" });
    setAberto(true);
  };

  const abrirEditar = (s: Sociedade) => {
    setEditando(s);
    form.reset({ nome: s.nome, tipo: (TIPOS as readonly string[]).includes(s.tipo) ? (s.tipo as FormData["tipo"]) : "Outra" });
    setAberto(true);
  };

  const onSubmit = async (values: FormData) => {
    const payload = { nome: values.nome, tipo: values.tipo };
    if (editando) {
      await atualizar.mutateAsync({ id: editando.id, ...payload });
    } else {
      await criar.mutateAsync(payload);
    }
    setAberto(false);
  };

  const colunas: Coluna<Sociedade>[] = [
    { chave: "nome", cabecalho: "Nome", render: (s) => <span className="font-medium">{s.nome}</span> },
    { chave: "tipo", cabecalho: "Tipo", render: (s) => s.tipo },
    { chave: "status", cabecalho: "Status", render: (s) => <StatusBadge ativo={s.status === "ativa"} /> },
    {
      chave: "acoes",
      cabecalho: "",
      className: "w-1 text-right",
      render: (s) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => abrirEditar(s)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmando(s)}>
            <Power className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ShellPainel titulo="Sociedades" descricao="Cadastro das sociedades internas da igreja.">
      <DataTable
        dados={data ?? []}
        colunas={colunas}
        carregando={isLoading}
        buscaPlaceholder="Buscar por nome ou tipo..."
        filtrarPor={(s, t) => s.nome.toLowerCase().includes(t) || s.tipo.toLowerCase().includes(t)}
        acoes={
          <Button onClick={abrirNovo}>
            <Plus className="h-4 w-4" />
            Nova sociedade
          </Button>
        }
      />

      <FormDialog
        open={aberto}
        onOpenChange={setAberto}
        titulo={editando ? "Editar sociedade" : "Nova sociedade"}
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
                {TIPOS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
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
        titulo={confirmando?.status === "ativa" ? "Inativar sociedade?" : "Reativar sociedade?"}
        descricao={`Esta ação altera o status de "${confirmando?.nome}".`}
        textoConfirmar={confirmando?.status === "ativa" ? "Inativar" : "Reativar"}
        destrutivo={confirmando?.status === "ativa"}
        onConfirmar={() => {
          if (confirmando) {
            alternar.mutate({ id: confirmando.id, ativa: confirmando.status !== "ativa" });
            setConfirmando(null);
          }
        }}
      />
    </ShellPainel>
  );
}
