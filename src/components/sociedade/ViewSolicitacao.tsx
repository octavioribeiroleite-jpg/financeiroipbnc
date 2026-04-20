import { TimelineStatus } from "./TimelineStatus";
import { Solicitacao } from "@/hooks/sociedade/useSolicitacoesSociedade";
import { useFornecedores } from "@/hooks/cadastros/useFornecedores";
import { useCategorias } from "@/hooks/cadastros/useCategorias";
import { formatarData, formatarMoeda } from "@/lib/format";
import { Separator } from "@/components/ui/separator";
import { UploadAnexo } from "@/components/shared/UploadAnexo";

interface Props {
  registro: Solicitacao;
}

export function ViewSolicitacao({ registro }: Props) {
  const { data: fornecedores } = useFornecedores();
  const { data: categorias } = useCategorias();

  const fornecedor = fornecedores?.find((f) => f.id === registro.fornecedor_id);
  const categoria = categorias?.find((c) => c.id === registro.categoria_id);

  return (
    <div className="space-y-4">
      <TimelineStatus status={registro.status} />
      <Separator />

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Fornecedor</dt>
          <dd className="font-medium">{fornecedor?.nome_fantasia ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Categoria</dt>
          <dd className="font-medium">{categoria?.nome ?? "—"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-muted-foreground">Descrição</dt>
          <dd className="font-medium">{registro.descricao}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Valor</dt>
          <dd className="font-medium">{formatarMoeda(Number(registro.valor))}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Vencimento</dt>
          <dd className="font-medium">{formatarData(registro.vencimento)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Criada em</dt>
          <dd className="font-medium">{formatarData(registro.data_criacao)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Última atualização</dt>
          <dd className="font-medium">{formatarData(registro.data_atualizacao)}</dd>
        </div>
        {registro.data_pagamento && (
          <div>
            <dt className="text-xs text-muted-foreground">Data de pagamento</dt>
            <dd className="font-medium">{formatarData(registro.data_pagamento)}</dd>
          </div>
        )}
      </dl>

      {registro.observacoes && (
        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Observações</p>
          <p>{registro.observacoes}</p>
        </div>
      )}

      {registro.motivo_recusa && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
          <p className="mb-1 text-xs font-medium text-destructive">Motivo da recusa</p>
          <p>{registro.motivo_recusa}</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {registro.anexo_nota_url && (
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Nota fiscal</p>
            <UploadAnexo
              sociedadeId={registro.sociedade_id}
              pasta="solicitacoes-nota"
              caminho={registro.anexo_nota_url}
              onChange={() => {}}
              disabled
            />
          </div>
        )}
        {registro.anexo_comprovante_url && (
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Comprovante</p>
            <UploadAnexo
              sociedadeId={registro.sociedade_id}
              pasta="solicitacoes-comprovante"
              caminho={registro.anexo_comprovante_url}
              onChange={() => {}}
              disabled
            />
          </div>
        )}
      </div>
    </div>
  );
}
