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
  confirmada?: boolean | null;
  sociedade_nome?: string | null;
}

export interface GerarPdfInput {
  fechamento: Fechamento;
  nomeSociedade: string;
  movimentacoes: MovimentacaoMesPdf[];
  config: ConfigIgreja;
  geradoPor?: string | null;
  saldoPorSociedade?: { nome: string; saldoFinal: number }[];
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

function labelTipo(tipo: MovimentacaoMesPdf["tipo"]): string {
  if (tipo === "entrada") return "Entrada";
  if (tipo === "saida") return "Saída";
  return "Ajuste";
}

function labelOrigem(origem: string): string {
  const labels: Record<string, string> = {
    contribuicao: "Entrada registrada",
    solicitacao_pagamento: "Pagamento realizado",
    ajuste: "Ajuste manual",
  };
  return labels[origem] ?? origem;
}

function impactoSaldo(m: MovimentacaoMesPdf): number {
  const valor = Number(m.valor) || 0;
  return m.tipo === "saida" ? -valor : valor;
}

function somaMovs(movs: MovimentacaoMesPdf[], tipo: "entrada" | "saida"): number {
  return movs
    .filter((m) => m.tipo === tipo)
    .reduce((acc, m) => acc + (Number(m.valor) || 0), 0);
}

/** Gera o PDF e retorna o documento jsPDF (caller chama .save()). */
export function gerarPdfFechamento(input: GerarPdfInput): jsPDF {
  const { fechamento: f, nomeSociedade, movimentacoes, config, geradoPor } = input;
  const movimentacoesContabilizadas = movimentacoes.filter((m) => m.confirmada !== false);
  const movimentacoesNaoContabilizadas = movimentacoes.filter((m) => m.confirmada === false);
  const entradasContabilizadas = movimentacoesContabilizadas.filter((m) => m.tipo === "entrada");
  const saidasContabilizadas = movimentacoesContabilizadas.filter((m) => m.tipo === "saida");
  const ajustesContabilizados = movimentacoesContabilizadas.filter((m) => m.tipo === "ajuste");
  const incluiSociedade = movimentacoes.some((m) => !!m.sociedade_nome);

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
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(75);
  const introducao = doc.splitTextToSize(
    "Este relatório apresenta, de forma resumida e detalhada, o dinheiro recebido, os pagamentos realizados e como foi formado o saldo final do mês. Somente movimentações confirmadas entram nos totais do fechamento.",
    pageW - margin * 2,
  );
  doc.text(introducao, margin, y);
  y += introducao.length * 4.2 + 4;

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

  // ---------- Composição do resultado ----------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20);
  doc.text("Como o saldo final foi formado", margin, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    body: [
      ["Saldo inicial do mês", formatarMoeda(Number(f.saldo_inicial))],
      ["+ Entradas confirmadas", formatarMoeda(Number(f.total_entradas))],
      ["- Saídas confirmadas", formatarMoeda(Number(f.total_saidas))],
      ["= Saldo final para o próximo mês", formatarMoeda(Number(f.saldo_final))],
    ],
    styles: { fontSize: 8.5, cellPadding: 1.7, textColor: 35 },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 42, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.row.index === 3) {
        data.cell.styles.fillColor = [245, 248, 252];
        data.cell.styles.fontStyle = "bold";
      }
      if (data.column.index === 1 && data.row.index === 1) {
        data.cell.styles.textColor = [22, 101, 52];
      }
      if (data.column.index === 1 && data.row.index === 2) {
        data.cell.styles.textColor = [159, 18, 57];
      }
    },
    margin: { left: margin, right: margin },
    theme: "grid",
  });

  // @ts-expect-error - lastAutoTable é injetado pelo autoTable
  y = (doc.lastAutoTable?.finalY ?? y + 28) + 7;

  // ---------- Leitura rapida ----------
  autoTable(doc, {
    startY: y,
    head: [["Leitura rápida", "Quantidade", "Total"]],
    body: [
      ["Entradas contabilizadas", String(entradasContabilizadas.length), formatarMoeda(somaMovs(entradasContabilizadas, "entrada"))],
      ["Saídas contabilizadas", String(saidasContabilizadas.length), formatarMoeda(somaMovs(saidasContabilizadas, "saida"))],
      ["Ajustes contabilizados", String(ajustesContabilizados.length), formatarMoeda(ajustesContabilizados.reduce((acc, m) => acc + impactoSaldo(m), 0))],
      ["Lançamentos não contabilizados", String(movimentacoesNaoContabilizadas.length), formatarMoeda(movimentacoesNaoContabilizadas.reduce((acc, m) => acc + Math.abs(impactoSaldo(m)), 0))],
    ],
    styles: { fontSize: 8.3, cellPadding: 1.6, textColor: 35 },
    headStyles: { fillColor: [230, 235, 242], textColor: 30, fontStyle: "bold" },
    columnStyles: {
      1: { cellWidth: 26, halign: "center" },
      2: { cellWidth: 34, halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  // @ts-expect-error - lastAutoTable é injetado pelo autoTable
  y = (doc.lastAutoTable?.finalY ?? y + 28) + 7;

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
  doc.text("Movimentações contabilizadas no fechamento", margin, y);
  y += 3;

  const linhas = movimentacoesContabilizadas.map((m) => {
    const v = Number(m.valor) || 0;
    if (incluiSociedade) {
      return [
        formatarData(m.data_movimento),
        m.sociedade_nome ?? "",
        labelTipo(m.tipo),
        [labelOrigem(m.origem), m.observacao].filter(Boolean).join(" - "),
        formatarMoeda(v),
        m.tipo,
      ];
    }
    return [
      formatarData(m.data_movimento),
      labelTipo(m.tipo),
      labelOrigem(m.origem),
      m.observacao ?? "",
      formatarMoeda(v),
      m.tipo,
    ];
  });

  let totalEntradas = 0;
  let totalSaidas = 0;
  for (const m of movimentacoesContabilizadas) {
    const v = Number(m.valor) || 0;
    if (m.tipo === "entrada" || m.tipo === "ajuste") totalEntradas += v;
    else if (m.tipo === "saida") totalSaidas += v;
  }

  autoTable(doc, {
    startY: y + 2,
    head: [incluiSociedade ? ["Data", "Sociedade", "Tipo", "Descrição", "Valor"] : ["Data", "Tipo", "Origem", "Descrição", "Valor"]],
    body: linhas.length
      ? linhas.map((l) => l.slice(0, 5))
      : [[{ content: "Sem movimentações contabilizadas no período.", colSpan: 5, styles: { halign: "center", textColor: 130 } } as never]],
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
      1: { cellWidth: incluiSociedade ? 30 : 20 },
      2: { cellWidth: incluiSociedade ? 20 : 38 },
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

  // @ts-expect-error - lastAutoTable é injetado pelo autoTable
  let finalTabelaY: number = doc.lastAutoTable?.finalY ?? y + 30;

  if (movimentacoesNaoContabilizadas.length > 0) {
    let yNao = finalTabelaY + 9;
    if (yNao + 32 > pageH - 20) {
      doc.addPage();
      yNao = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(20);
    doc.text("Lançamentos não contabilizados no saldo", margin, yNao);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(90);
    doc.text("Itens abaixo aparecem para conferência, mas não entraram no saldo final deste fechamento.", margin, yNao + 4);

    autoTable(doc, {
      startY: yNao + 7,
      head: [incluiSociedade ? ["Data", "Sociedade", "Tipo", "Descrição", "Valor"] : ["Data", "Tipo", "Origem", "Descrição", "Valor"]],
      body: movimentacoesNaoContabilizadas.map((m) => incluiSociedade
        ? [
            formatarData(m.data_movimento),
            m.sociedade_nome ?? "",
            labelTipo(m.tipo),
            [labelOrigem(m.origem), m.observacao].filter(Boolean).join(" - "),
            formatarMoeda(Number(m.valor) || 0),
          ]
        : [
            formatarData(m.data_movimento),
            labelTipo(m.tipo),
            labelOrigem(m.origem),
            m.observacao ?? "",
            formatarMoeda(Number(m.valor) || 0),
          ]),
      styles: { fontSize: 8.3, cellPadding: 1.5, textColor: 45 },
      headStyles: { fillColor: [245, 230, 180], textColor: 35, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: incluiSociedade ? 30 : 20 },
        2: { cellWidth: incluiSociedade ? 20 : 38 },
        3: { cellWidth: "auto" },
        4: { cellWidth: 28, halign: "right" },
      },
      margin: { left: margin, right: margin },
    });

    // @ts-expect-error - lastAutoTable é injetado pelo autoTable
    finalTabelaY = doc.lastAutoTable?.finalY ?? yNao + 30;
  }

  // ---------- Bloco de assinaturas ----------
  const espacoAssinaturas = 38;
  let yAss = finalTabelaY + 14;
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
