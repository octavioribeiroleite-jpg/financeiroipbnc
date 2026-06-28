import { UploadAnexo } from "./UploadAnexo";

interface Props {
  sociedadeId: string;
  pasta: string;
  rotulo: string;
  valores: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  disabled?: boolean;
}

/** Permite anexar até `max` arquivos (default 2), reutilizando UploadAnexo por slot. */
export function UploadAnexosMultiplos({
  sociedadeId,
  pasta,
  rotulo,
  valores,
  onChange,
  max = 2,
  disabled,
}: Props) {
  const slots: (string | null)[] = Array.from({ length: max }, (_, i) => valores[i] ?? null);
  // só mostra o próximo slot vazio (não todos de uma vez) para evitar poluição
  const ultimoPreenchido = slots.findIndex((s) => !s);
  const slotsVisiveis = slots
    .map((s, i) => ({ s, i }))
    .filter(({ s, i }) => s !== null || i === (ultimoPreenchido === -1 ? max - 1 : ultimoPreenchido));

  const atualizar = (indice: number, novo: string | null) => {
    const proximos = [...slots];
    proximos[indice] = novo;
    onChange(proximos.filter((v): v is string => !!v));
  };

  return (
    <div className="space-y-2">
      {slotsVisiveis.map(({ s, i }) => (
        <div key={i}>
          <UploadAnexo
            sociedadeId={sociedadeId}
            pasta={pasta}
            caminho={s}
            onChange={(novo) => atualizar(i, novo)}
            rotulo={`${rotulo} ${i + 1} de ${max}`}
            disabled={disabled}
          />
        </div>
      ))}
    </div>
  );
}
