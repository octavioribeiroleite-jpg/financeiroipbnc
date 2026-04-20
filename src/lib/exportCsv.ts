// Utilitário simples para exportar dados como CSV (cliente).

function escapar(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  const s = String(valor);
  if (/[",;\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export interface ColunaCsv<T> {
  cabecalho: string;
  /** Função que extrai o valor da linha. */
  valor: (row: T) => unknown;
}

export function exportarCsv<T>(
  nomeArquivo: string,
  colunas: ColunaCsv<T>[],
  linhas: T[],
): void {
  const sep = ";"; // Excel pt-BR
  const header = colunas.map((c) => escapar(c.cabecalho)).join(sep);
  const body = linhas
    .map((row) => colunas.map((c) => escapar(c.valor(row))).join(sep))
    .join("\n");
  const csv = "\uFEFF" + header + "\n" + body; // BOM para acentos no Excel
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo.endsWith(".csv") ? nomeArquivo : `${nomeArquivo}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
