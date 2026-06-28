import { useEffect } from "react";
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
import { MonthPicker } from "@/components/shared/MonthPicker";
import { UploadAnexo } from "@/components/shared/UploadAnexo";
import { UploadAnexosMultiplos } from "@/components/shared/UploadAnexosMultiplos";

import { hojeISO, primeiroDiaMesAtual } from "@/lib/format";
import {
  Contribuicao,
  ContribuicaoInput,
  useAtualizarContribuicao,
  useCriarContribuicao,
} from "@/hooks/sociedade/useContribuicoesSociedade";
import { useMesConsolidado } from "@/hooks/fechamentos/useMesConsolidado";
import { AvisoMesConsolidado } from "@/components/fechamentos/AvisoMesConsolidado";

const FORMAS = ["Dinheiro", "PIX", "Transferência", "Cartão", "Outro"] as const;

const schema = z.object({
  membro_nome: z.string().trim().min(2, "Mínimo 2 caracteres").max(120),
  referencia_mes: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Mês obrigatório"),
  valor: z.number().positive("Valor deve ser maior que zero"),
  data_pagamento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
    .refine((d) => d <= hojeISO(), "Data não pode ser futura"),
  forma_pagamento: z.enum(FORMAS),
  comprovante_url: z.string().nullable().optional(),
  comprovantes_pagamento_urls: z.array(z.string()).max(2).default([]),
  recibos_urls: z.array(z.string()).max(2).default([]),
  observacao: z.string().max(500).nullable().optional(),
});
type FormData = z.infer<typeof schema>;


interface Props {
  sociedadeId: string;
  usuarioId: string;
  registro: Contribuicao | null;
  onConcluido: () => void;
  onCancelar: () => void;
}

export function FormContribuicao({ sociedadeId, usuarioId, registro, onConcluido, onCancelar }: Props) {
  const criar = useCriarContribuicao(sociedadeId, usuarioId);
  const atualizar = useAtualizarContribuicao(sociedadeId);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      membro_nome: "",
      referencia_mes: primeiroDiaMesAtual(),
      valor: 0,
      data_pagamento: hojeISO(),
      forma_pagamento: "PIX",
      comprovante_url: null,
      comprovantes_pagamento_urls: [],
      recibos_urls: [],
      observacao: "",
    },
  });

  useEffect(() => {
    if (registro) {
      const r = registro as typeof registro & {
        comprovantes_pagamento_urls?: string[] | null;
        recibos_urls?: string[] | null;
      };
      form.reset({
        membro_nome: registro.membro_nome,
        referencia_mes: registro.referencia_mes,
        valor: Number(registro.valor),
        data_pagamento: registro.data_pagamento,
        forma_pagamento: (FORMAS as readonly string[]).includes(registro.forma_pagamento)
          ? (registro.forma_pagamento as FormData["forma_pagamento"])
          : "Outro",
        comprovante_url: registro.comprovante_url,
        comprovantes_pagamento_urls: r.comprovantes_pagamento_urls ?? [],
        recibos_urls: r.recibos_urls ?? [],
        observacao: registro.observacao ?? "",
      });
    }
  }, [registro, form]);

  const onSubmit = async (v: FormData) => {
    const payload: ContribuicaoInput = {
      membro_nome: v.membro_nome,
      referencia_mes: v.referencia_mes,
      valor: v.valor,
      data_pagamento: v.data_pagamento,
      forma_pagamento: v.forma_pagamento,
      comprovante_url: v.comprovante_url ?? null,
      comprovantes_pagamento_urls: v.comprovantes_pagamento_urls ?? [],
      recibos_urls: v.recibos_urls ?? [],
      observacao: v.observacao || null,
    };
    if (registro) await atualizar.mutateAsync({ id: registro.id, ...payload });
    else await criar.mutateAsync(payload);
    onConcluido();
  };



  const submetendo = criar.isPending || atualizar.isPending;
  const dataPagamento = form.watch("data_pagamento");
  const { data: travado } = useMesConsolidado(sociedadeId, dataPagamento);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <AvisoMesConsolidado
        visivel={!!travado}
        mensagem="A data de pagamento informada cai em um mês já consolidado. Escolha outra data."
      />
      <div className="space-y-2">
        <Label htmlFor="membro_nome">Membro</Label>
        <Input id="membro_nome" {...form.register("membro_nome")} />
        {form.formState.errors.membro_nome && (
          <p className="text-xs text-destructive">{form.formState.errors.membro_nome.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="referencia_mes">Mês de referência</Label>
          <Controller
            control={form.control}
            name="referencia_mes"
            render={({ field }) => (
              <MonthPicker id="referencia_mes" value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="data_pagamento">Data do pagamento</Label>
          <Input id="data_pagamento" type="date" {...form.register("data_pagamento")} max={hojeISO()} />
          {form.formState.errors.data_pagamento && (
            <p className="text-xs text-destructive">
              {form.formState.errors.data_pagamento.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="valor">Valor</Label>
          <Controller
            control={form.control}
            name="valor"
            render={({ field }) => (
              <CurrencyInput id="valor" value={field.value} onChange={field.onChange} />
            )}
          />
          {form.formState.errors.valor && (
            <p className="text-xs text-destructive">{form.formState.errors.valor.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="forma_pagamento">Forma de pagamento</Label>
          <Controller
            control={form.control}
            name="forma_pagamento"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="forma_pagamento">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Comprovante (principal)</Label>
        <Controller
          control={form.control}
          name="comprovante_url"
          render={({ field }) => (
            <UploadAnexo
              sociedadeId={sociedadeId}
              pasta="contribuicoes"
              caminho={field.value ?? null}
              onChange={field.onChange}
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
              pasta="contribuicoes-comprovantes"
              rotulo="Comprovante"
              valores={field.value ?? []}
              onChange={field.onChange}
              max={2}
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
              pasta="contribuicoes-recibos"
              rotulo="Recibo"
              valores={field.value ?? []}
              onChange={field.onChange}
              max={2}
            />
          )}
        />
      </div>


      <div className="space-y-2">
        <Label htmlFor="observacao">Observação</Label>
        <Textarea id="observacao" rows={2} {...form.register("observacao")} />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submetendo || !!travado}>
          {registro ? "Salvar alterações" : "Registrar"}
        </Button>
      </div>
    </form>
  );
}
