import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { DataTable, Coluna } from "@/components/painel/DataTable";
import { FormDialog } from "@/components/painel/FormDialog";
import { StatusBadge } from "@/components/painel/StatusBadge";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  UsuarioComPapeis,
  useAtualizarUsuario,
  useDefinirPapeisUsuario,
  useUsuariosComPapeis,
} from "@/hooks/cadastros/useUsuarios";
import { useSociedades } from "@/hooks/cadastros/useSociedades";

const PAPEIS_DISPONIVEIS: { valor: AppRole; rotulo: string }[] = [
  { valor: "administrador", rotulo: "Administrador" },
  { valor: "tesoureiro_igreja", rotulo: "Tesoureiro da Igreja" },
  { valor: "tesoureiro_central", rotulo: "Tesoureiro Central" },
  { valor: "tesoureiro_sociedade", rotulo: "Tesoureiro da Sociedade" },
];

const schema = z
  .object({
    nome: z.string().trim().min(2, "Mínimo 2 caracteres").max(120),
    sociedade_id: z.string().optional().or(z.literal("")),
    ativo: z.boolean(),
    papeis: z.array(z.enum(["administrador", "tesoureiro_igreja", "tesoureiro_central", "tesoureiro_sociedade"])),
  })
  .refine(
    (v) => !v.papeis.includes("tesoureiro_sociedade") || !!v.sociedade_id,
    { message: "Tesoureiro de sociedade exige uma sociedade vinculada.", path: ["sociedade_id"] },
  );
type FormData = z.infer<typeof schema>;

const SEM_SOCIEDADE = "__sem__";

export default function Usuarios() {
  const { user } = useAuth();
  const { data: usuarios, isLoading } = useUsuariosComPapeis();
  const { data: sociedades } = useSociedades();
  const atualizar = useAtualizarUsuario();
  const definirPapeis = useDefinirPapeisUsuario();

  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<UsuarioComPapeis | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", sociedade_id: "", ativo: true, papeis: [] },
  });

  const abrirEditar = (u: UsuarioComPapeis) => {
    setEditando(u);
    form.reset({
      nome: u.nome,
      sociedade_id: u.sociedade_id ?? "",
      ativo: u.ativo,
      papeis: u.papeis,
    });
    setAberto(true);
  };

  const onSubmit = async (v: FormData) => {
    if (!editando) return;

    // Salvaguarda 1: não desativar a si mesmo.
    if (editando.id === user?.id && !v.ativo) {
      toast.error("Você não pode desativar a própria conta.");
      return;
    }

    // Salvaguarda 2: não remover o último administrador.
    const totalAdmins = (usuarios ?? []).filter((u) => u.papeis.includes("administrador") && u.ativo).length;
    const eraAdmin = editando.papeis.includes("administrador");
    const seguiraAdmin = v.papeis.includes("administrador") && v.ativo;
    if (eraAdmin && !seguiraAdmin && totalAdmins <= 1) {
      toast.error("Não é possível remover o último administrador ativo.");
      return;
    }

    await atualizar.mutateAsync({
      id: editando.id,
      nome: v.nome,
      sociedade_id: v.sociedade_id || null,
      ativo: v.ativo,
    });
    await definirPapeis.mutateAsync({ usuario_id: editando.id, papeis: v.papeis });
    setAberto(false);
  };

  const nomeSociedade = (id: string | null) =>
    (sociedades ?? []).find((s) => s.id === id)?.nome ?? "—";

  const colunas: Coluna<UsuarioComPapeis>[] = [
    { chave: "nome", cabecalho: "Nome", render: (u) => <span className="font-medium">{u.nome}</span> },
    { chave: "email", cabecalho: "E-mail", render: (u) => u.email },
    {
      chave: "papeis",
      cabecalho: "Papéis",
      render: (u) =>
        u.papeis.length === 0 ? (
          <span className="text-xs text-muted-foreground">Sem papel</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {u.papeis.map((p) => (
              <Badge key={p} variant="secondary" className="text-xs">
                {PAPEIS_DISPONIVEIS.find((d) => d.valor === p)?.rotulo ?? p}
              </Badge>
            ))}
          </div>
        ),
    },
    { chave: "sociedade", cabecalho: "Sociedade", render: (u) => nomeSociedade(u.sociedade_id) },
    { chave: "status", cabecalho: "Status", render: (u) => <StatusBadge ativo={u.ativo} /> },
    {
      chave: "acoes",
      cabecalho: "",
      className: "w-1 text-right",
      render: (u) => (
        <Button variant="ghost" size="sm" onClick={() => abrirEditar(u)}>
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const papeisSel = form.watch("papeis");
  const sociedadeSel = form.watch("sociedade_id") || SEM_SOCIEDADE;

  const togglePapel = (papel: AppRole, checked: boolean) => {
    const atual = form.getValues("papeis");
    const novo = checked ? [...atual, papel] : atual.filter((p) => p !== papel);
    form.setValue("papeis", novo, { shouldValidate: true });
  };

  return (
    <ShellPainel
      titulo="Usuários"
      descricao="Atribua papéis e vincule tesoureiros às sociedades."
    >
      <DataTable
        dados={usuarios ?? []}
        colunas={colunas}
        carregando={isLoading}
        buscaPlaceholder="Buscar por nome ou e-mail..."
        filtrarPor={(u, t) => u.nome.toLowerCase().includes(t) || u.email.toLowerCase().includes(t)}
      />

      <FormDialog
        open={aberto}
        onOpenChange={setAberto}
        titulo="Editar usuário"
        descricao={editando?.email}
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
            <Label>Papéis</Label>
            <div className="space-y-2 rounded-md border p-3">
              {PAPEIS_DISPONIVEIS.map((p) => (
                <label key={p.valor} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={papeisSel.includes(p.valor)}
                    onCheckedChange={(c) => togglePapel(p.valor, !!c)}
                  />
                  {p.rotulo}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sociedade_id">
              Sociedade vinculada
              {papeisSel.includes("tesoureiro_sociedade") && <span className="text-destructive"> *</span>}
            </Label>
            <Select
              value={sociedadeSel}
              onValueChange={(v) => form.setValue("sociedade_id", v === SEM_SOCIEDADE ? "" : v, { shouldValidate: true })}
            >
              <SelectTrigger id="sociedade_id">
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_SOCIEDADE}>Sem vínculo</SelectItem>
                {(sociedades ?? []).filter((s) => s.status === "ativa").map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nome} ({s.tipo})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.sociedade_id && (
              <p className="text-xs text-destructive">{form.formState.errors.sociedade_id.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="ativo" className="cursor-pointer">Usuário ativo</Label>
              <p className="text-xs text-muted-foreground">Inativar bloqueia o login imediatamente.</p>
            </div>
            <Switch
              id="ativo"
              checked={form.watch("ativo")}
              onCheckedChange={(c) => form.setValue("ativo", c)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setAberto(false)}>Cancelar</Button>
            <Button type="submit" disabled={atualizar.isPending || definirPapeis.isPending}>
              Salvar alterações
            </Button>
          </div>
        </form>
      </FormDialog>
    </ShellPainel>
  );
}
