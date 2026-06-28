import { useEffect, useMemo } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { UploadAnexo } from "@/components/shared/UploadAnexo";
import { UploadAnexosMultiplos } from "@/components/shared/UploadAnexosMultiplos";
import { hojeISO } from "@/lib/format";
import { useFornecedores } from "@/hooks/cadastros/useFornecedores";
import { useCategorias } from "@/hooks/cadastros/useCategorias";
import {
  Solicitacao,
  SolicitacaoInput,
  useCriarSolicitacao,
  useAtualizarSolicitacaoEditavel,
} from "@/hooks/sociedade/useSolicitacoesSociedade";
import { useMesConsolidado } from "@/hooks/fechamentos/useMesConsolidado";
import { AvisoMesConsolidado } from "@/components/fechamentos/AvisoMesConsolidado";

const SEM_CATEGORIA = "__sem__";

const schema = z.object({
  fornecedor_id: z.string().uuid("Fornecedor obrigatório"),
  categoria_id: z.string().nullable().optional(),
  descricao: z.string().trim().min(3, "Descrição muito curta").max(200),
  valor: z.number().positive("Valor deve ser maior que zero"),
  vencimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Vencimento obrigatório")
    .refine((d) => d >= hojeISO(), "Vencimento não pode ser anterior a hoje"),
  observacoes: z.string().max(500).nullable().optional(),
  anexo_nota_url: z.string().nullable().optional(),
  comprovantes_pagamento_urls: z.array(z.string()).max(2).default([]),
  recibos_urls: z.array(z.string()).max(2).default([]),
});

type FormData = z.infer<typeof schema>;

interface Props {
  sociedadeId: string;
  usuarioId: string;
  registro: Solicitacao | null;
  onConcluido: () => void;
  onCancelar: () => void;
}

function valoresIniciais(): FormData {
  return {
    fornecedor_id: "",
    categoria_id: null,
    descricao: "",
    valor: 0,
    vencimento: hojeISO(),
    observacoes: "",
    anexo_nota_url: null,
    comprovantes_pagamento_urls: [],
    recibos_urls: [],
  };
}

export function FormSolicitacao({ sociedadeId, usuarioId, registro, onConcluido, onCancelar }: Props) {
  const { data: fornecedores } = useFornecedores();
  const { data: categorias } = useCategorias();
  const criar = useCriarSolicitacao(sociedadeId, usuarioId);
  const atualizar = useAtualizarSolicitacaoEditavel(sociedadeId);

  const fornecedoresAtivos = useMemo(
    () => (fornecedores ?? []).filter((f) => f.ativo),
    [fornecedores],
  );
  const categoriasSaida = useMemo(
    () => (categorias ?? []).filter((c) => c.ativo && c.tipo === "saida"),
    [categorias],
  );

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: valoresIniciais(),
  });

  useEffect(() => {
    if (registro) {
      const r = registro as typeof registro & {
        comprovantes_pagamento_urls?: string[] | null;
        recibos_urls?: string[] | null;
      };
      form.reset({
        fornecedor_id: registro.fornecedor_id,
        categoria_id: registro.categoria_id,
        descricao: registro.descricao,
        valor: Number(registro.valor),
        vencimento: registro.vencimento,
        observacoes: registro.observacoes ?? "",
        anexo_nota_url: registro.anexo_nota_url,
        comprovantes_pagamento_urls: r.comprovantes_pagamento_urls ?? [],
        recibos_urls: r.recibos_urls ?? [],
      });
      return;
    }
    form.reset(valoresIniciais());
  }, [registro, form]);

  const salvar = async (v: FormData, status: "rascunho" | "enviada") => {
    const payload: SolicitacaoInput = {
      fornecedor_id: v.fornecedor_id,
      categoria_id: v.categoria_id || null,
      descricao: v.descricao,
      valor: v.valor,
      vencimento: v.vencimento,
      observacoes: v.observacoes || null,
      anexo_nota_url: v.anexo_nota_url || null,
      comprovantes_pagamento_urls: v.comprovantes_pagamento_urls ?? [],
      recibos_urls: v.recibos_urls ?? [],
    };

    if (registro) {
      const statusFinal = registro.status === "enviada" ? "enviada" : status;
      await atualizar.mutateAsync({ id: registro.id, ...payload, status: statusFinal });
    } else {
      await criar.mutateAsync({ ...payload, status });
    }
    onConcluido();
  };

  const submetendo = criar.isPending || atualizar.isPending;
  const podeEditar = !registro || registro.status === "rascunho" || registro.status === "enviada";
  const registroEnviado = registro?.status === "enviada";
  const vencimento = form.watch("vencimento");
  const { data: travado } = useMesConsolidado(sociedadeId, vencimento);

  return (
    <form onSubmit={form.handleSubmit((v) => salvar(v, "rascunho"))} className="space-y-4">
      <AvisoMesConsolidado
        visivel={!!travado}
        mensagem="O vencimento escolhido cai em um mês já consolidado. Escolha outra data."
      />

      {registroEnviado && (
        <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-foreground/90">
          Este pagamento já foi enviado. As alterações serão atualizadas diretamente para a Central enquanto a análise não tiver sido iniciada.
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="fornecedor_id">Fornecedor</Label>
        <Controller
          control={form.control}
          name="fornecedor_id"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={!podeEditar}>
              <SelectTrigger id="fornecedor_id">
                <SelectValue placeholder="Selecionar fornecedor..." />
              </SelectTrigger>
              <SelectContent>
                {fornecedoresAtivos.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome_fantasia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.fornecedor_id && (
          <p className="text-xs text-destructive">{form.formState.errors.fornecedor_id.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Input id="descricao" {...form.register("descricao")} disabled={!podeEditar} />
        {form.formState.errors.descricao && (
          <p className="text-xs text-destructive">{form.formState.errors.descricao.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="categoria_id">Categoria</Label>
          <Controller
            control={form.control}
            name="categoria_id"
            render={({ field }) => (
              <Select
                value={field.value ?? SEM_CATEGORIA}
                onValueChange={(v) => field.onChange(v === SEM_CATEGORIA ? null : v)}
                disabled={!podeEditar}
              >
                <SelectTrigger id="categoria_id">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEM_CATEGORIA}>Sem categoria</SelectItem>
                  {categoriasSaida.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vencimento">Vencimento</Label>
          <Input
            id="vencimento"
            type="date"
            {...form.register("vencimento")}
            min={hojeISO()}
            disabled={!podeEditar}
          />
          {form.formState.errors.vencimento && (
            <p className="text-xs text-destructive">{form.formState.errors.vencimento.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="valor">Valor</Label>
        <Controller
          control={form.control}
          name="valor"
          render={({ field }) => (
            <CurrencyInput id="valor" value={field.value} onChange={field.onChange} disabled={!podeEditar} />
          )}
        />
        {form.formState.errors.valor && (
          <p className="text-xs text-destructive">{form.formState.errors.valor.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Nota fiscal</Label>
        <Controller
          control={form.control}
          name="anexo_nota_url"
          render={({ field }) => (
            <UploadAnexo
              sociedadeId={sociedadeId}
              pasta="solicitacoes-nota"
              caminho={field.value ?? null}
              onChange={field.onChange}
              disabled={!podeEditar}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label>Comprovantes de pagamento (até 2)</Label>
        <Controller
          control={form.control}
          name="comprovantes_pagamento_urls"
          render={({ field }) => (
            <UploadAnexosMultiplos
              sociedadeId={sociedadeId}
              pasta="solicitacoes-comprovantes"
              rotulo="Comprovante"
              valores={field.value ?? []}
              onChange={field.onChange}
              max={2}
              disabled={!podeEditar}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label>Recibos (até 2)</Label>
        <Controller
          control={form.control}
          name="recibos_urls"
          render={({ field }) => (
            <UploadAnexosMultiplos
              sociedadeId={sociedadeId}
              pasta="solicitacoes-recibos"
              rotulo="Recibo"
              valores={field.value ?? []}
              onChange={field.onChange}
              max={2}
              disabled={!podeEditar}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" rows={2} {...form.register("observacoes")} disabled={!podeEditar} />
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancelar}>
          Fechar
        </Button>
        {podeEditar && registroEnviado && (
          <Button
            type="button"
            disabled={submetendo || !!travado}
            onClick={form.handleSubmit((v) => salvar(v, "enviada"))}
          >
            Salvar alterações
          </Button>
        )}
        {podeEditar && !registroEnviado && (
          <>
            <Button type="submit" variant="outline" disabled={submetendo || !!travado}>
              Salvar rascunho
            </Button>
            <Button
              type="button"
              disabled={submetendo || !!travado}
              onClick={form.handleSubmit((v) => salvar(v, "enviada"))}
            >
              Liberar para processamento
            </Button>
          </>
        )}
      </div>
    </form>
  );
}

export default FormSolicitacao;
