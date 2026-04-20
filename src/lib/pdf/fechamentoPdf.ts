import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatarData, formatarMoeda } from "@/lib/format";
import type { ConfigIgreja } from "@/hooks/igreja/useConfigIgreja";
import type { Fechamento } from "@/hooks/fechamentos/useFechamentos";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto",
  enviado: "Enviado",
  conferido: "Conferido",
  consolidado: "Consolidado",
};

export interface MovimentacaoMesPdf {
  id: string;
  tipo: "entrada" | "saida" | "ajuste";
  origem: string;
  valor: number | string;
  data_movimento: string;
  observacao?: string | null;
}

export interface GerarPdfInput {
  fechamento: Fechamento;
  nomeSociedade: string;
  movimentacoes: MovimentacaoMesPdf[];
  config: ConfigIgreja;
  geradoPor?: string | null;
}

function slug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 40);
}

export function nomeArquivoFechamento(input: GerarPdfInput): string {
  const ym = `${input.fechamento.ano}-${String(input.fechamento.mes).padStart(2, "0")}`;
  return `fechamento_${slug(input.nomeSociedade)}_${ym}.pdf`;
}

/** Gera o PDF e retorna o documento jsPDF (caller chama .save()). */
export function gerarPdfFechamento(input: GerarPdfInput): jsPDF {
  const { fechamento: f, nomeSociedade, movimentacoes, config, geradoPor } = input;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  let y = margin;

  // ---------- Cabeçalho ----------
  let textX = margin;
  if (config.logoDataUrl) {
    try {
      const fmt = config.logoDataUrl.startsWith("data:image/jpeg") ? "JPEG" : "PNG";
      doc.addImage(config.logoDataUrl, fmt, margin, y, 22, 22, undefined, "FAST");
      textX = margin + 26;
    } catch {
      // ignora se a imagem for inválida
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(20);
  doc.text(config.nome || "Igreja", textX, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(70);
  if (config.subtitulo) doc.text(config.subtitulo, textX, y + 11);

  doc.setFontSize(8);
  doc.setTextColor(110);
  const linhasContato: string[] = [];
  if (config.endereco) linhasContato.push(config.endereco);
  const cidadeCnpj = [config.cidadeUf, config.cnpj ? `CNPJ ${config.cnpj}` : ""]
    .filter(Boolean)
    .join(" • ");
  if (cidadeCnpj) linhasContato.push(cidadeCnpj);
  linhasContato.forEach((l, i) => doc.text(l, textX, y + 15 + i * 4));

  y = Math.max(y + 24, y + 15 + linhasContato.length * 4 + 2);
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  // ---------- Título do documento ----------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20);
  doc.text("Prestação de contas mensal", pageW / 2, y, { align: "center" });
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`${nomeSociedade} — ${MESES[f.mes - 1]} / ${f.ano}`, pageW / 2, y, {
    align: "center",
  });
  y += 5;

  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(`Status: ${STATUS_LABEL[f.status] ?? f.status}`, pageW / 2, y, { align: "center" });
  y += 6;

  // ---------- Quadro-resumo ----------
  const boxes = [
    { label: "Saldo inicial", valor: formatarMoeda(Number(f.saldo_inicial)), color: [40, 40, 40] as const },
    { label: "Entradas", valor: formatarMoeda(Number(f.total_entradas)), color: [22, 101, 52] as const },
    { label: "Saídas", valor: formatarMoeda(Number(f.total_saidas)), color: [159, 18, 57] as const },
    { label: "Saldo final", valor: formatarMoeda(Number(f.saldo_final)), color: [20, 20, 20] as const, destaque: true },
  ];
  const boxW = (pageW - margin * 2 - 6) / 4;
  const boxH = 16;
  boxes.forEach((b, i) => {
    const x = margin + i * (boxW + 2);
    doc.setDrawColor(220);
    doc.setFillColor(b.destaque ? 245 : 250, b.destaque ? 245 : 250, b.destaque ? 245 : 250);
    doc.roundedRect(x, y, boxW, boxH, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(110);
    doc.text(b.label.toUpperCase(), x + 2, y + 4.5);
    doc.setFont("helvetica", b.destaque ? "bold" : "normal");
    doc.setFontSize(b.destaque ? 11 : 10);
    doc.setTextColor(b.color[0], b.color[1], b.color[2]);
    doc.text(b.valor, x + 2, y + 12);
  });
  y += boxH + 6;

  // ---------- Observação ----------
  if (f.observacao && f.observacao.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(60);
    doc.text("Observações", margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(40);
    const lines = doc.splitTextToSize(f.observacao.trim(), pageW - margin * 2 - 4);
    doc.setDrawColor(220);
    doc.setFillColor(248, 248, 248);
    const obsH = lines.length * 4.2 + 4;
    doc.roundedRect(margin, y, pageW - margin * 2, obsH, 1.5, 1.5, "FD");
    doc.text(lines, margin + 2, y + 5);
    y += obsH + 6;
  }

  // ---------- Extrato de movimentações ----------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20);
  doc.text("Extrato de movimentações", margin, y);
  y += 3;

  const linhas = movimentacoes.map((m) => {
    const v = Number(m.valor) || 0;
    return [
      formatarData(m.data_movimento),
      m.tipo === "entrada" ? "Entrada" : m.tipo === "saida" ? "Saída" : "Ajuste",
      m.origem,
      m.observacao ?? "",
      formatarMoeda(v),
      m.tipo,
    ];
  });

  let totalEntradas = 0;
  let totalSaidas = 0;
  for (const m of movimentacoes) {
    const v = Number(m.valor) || 0;
    if (m.tipo === "entrada" || m.tipo === "ajuste") totalEntradas += v;
    else if (m.tipo === "saida") totalSaidas += v;
  }

  autoTable(doc, {
    startY: y + 2,
    head: [["Data", "Tipo", "Origem", "Descrição", "Valor"]],
    body: linhas.length
      ? linhas.map((l) => l.slice(0, 5))
      : [[{ content: "Sem movimentações no período.", colSpan: 5, styles: { halign: "center", textColor: 130 } } as never]],
    foot:
      linhas.length > 0
        ? [
            [
              { content: "Totais", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } } as never,
              { content: `Entradas: ${formatarMoeda(totalEntradas)}`, styles: { halign: "left", textColor: [22, 101, 52] } } as never,
              { content: `Saídas: ${formatarMoeda(totalSaidas)}`, styles: { halign: "right", textColor: [159, 18, 57], fontStyle: "bold" } } as never,
            ],
          ]
        : undefined,
    styles: { fontSize: 8.5, cellPadding: 1.6, textColor: 30 },
    headStyles: { fillColor: [40, 40, 50], textColor: 255, fontStyle: "bold", fontSize: 8.5 },
    footStyles: { fillColor: [245, 245, 245], textColor: 30 },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 20 },
      2: { cellWidth: 38 },
      3: { cellWidth: "auto" },
      4: { cellWidth: 28, halign: "right" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 4) {
        const tipo = linhas[data.row.index]?.[5];
        if (tipo === "saida") data.cell.styles.textColor = [159, 18, 57];
        else data.cell.styles.textColor = [22, 101, 52];
      }
    },
    margin: { left: margin, right: margin },
  });

  // ---------- Bloco de assinaturas ----------
  // @ts-expect-error - lastAutoTable é injetado pelo autoTable
  const finalY: number = doc.lastAutoTable?.finalY ?? y + 30;
  const espacoAssinaturas = 38;
  let yAss = finalY + 14;
  if (yAss + espacoAssinaturas > pageH - 20) {
    doc.addPage();
    yAss = margin + 10;
  }

  const colW = (pageW - margin * 2 - 12) / 3;
  const rotulos = [
    "Tesoureiro(a) da Sociedade",
    "Presidente da Sociedade",
    "Tesoureiro(a) Central da Igreja",
  ];
  rotulos.forEach((rot, i) => {
    const x = margin + i * (colW + 6);
    doc.setDrawColor(120);
    doc.setLineWidth(0.3);
    doc.line(x, yAss + 16, x + colW, yAss + 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(60);
    doc.text(rot, x + colW / 2, yAss + 21, { align: "center" });
  });

  // ---------- Rodapé em todas as páginas ----------
  const total = doc.getNumberOfPages();
  const ger = `Gerado em ${formatarData(new Date().toISOString())} ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}${
    geradoPor ? ` por ${geradoPor}` : ""
  }`;
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(130);
    doc.text(ger, margin, pageH - 8);
    doc.text(`Página ${i} de ${total}`, pageW - margin, pageH - 8, { align: "right" });
  }

  return doc;
}
