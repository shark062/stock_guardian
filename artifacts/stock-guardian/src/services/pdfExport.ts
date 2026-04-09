import { jsPDF } from "jspdf";

const NAVY = [10, 31, 68] as const;
const GOLD = [201, 161, 74] as const;
const GRAY_LIGHT = [245, 247, 250] as const;
const GRAY_TEXT = [100, 110, 130] as const;
const DARK = [28, 28, 28] as const;

export interface PdfColumn {
  header: string;
  key: string;
  width?: number;
  align?: "left" | "center" | "right";
}

export interface PdfOptions {
  title: string;
  subtitle?: string;
  columns: PdfColumn[];
  rows: Record<string, string | number>[];
  filename?: string;
  orientation?: "portrait" | "landscape";
}

function drawWatermark(doc: jsPDF) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const cx = pw / 2;
  const cy = ph / 2;

  doc.saveGraphicsState();

  doc.setGState(doc.GState({ opacity: 0.055 }));
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");

  doc.setFontSize(34);
  doc.text("POWERED BY", cx, cy - 18, { align: "center", angle: 315 });
  doc.setFontSize(42);
  doc.text("SHARK_TECH", cx, cy + 2, { align: "center", angle: 315 });

  doc.setGState(doc.GState({ opacity: 0.035 }));
  doc.setFontSize(11);
  doc.setTextColor(...GOLD);

  const diagonal = Math.sqrt(pw * pw + ph * ph);
  const step = 60;
  const count = Math.ceil(diagonal / step) + 2;
  const angle = 315;

  for (let i = -count / 2; i <= count / 2; i++) {
    const offset = i * step;
    doc.text("SHARK_TECH  ·  ", cx + offset, cy, { align: "center", angle });
  }

  doc.restoreGraphicsState();
}

function drawHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pw = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pw, 28, "F");

  doc.setFillColor(...GOLD);
  doc.rect(margin, 10, 3, 14, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(title, margin + 8, 19);

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...GOLD);
    doc.text(subtitle, margin + 8, 25);
  }

  const dateStr = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(180, 195, 215);
  doc.text(dateStr, pw - margin, 20, { align: "right" });

  return 32;
}

function drawFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 14;
  const footerY = ph - 22;

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY, pw - margin, footerY);

  doc.setFillColor(...NAVY);
  doc.rect(0, footerY + 0.5, pw, 22, "F");

  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(11);
  doc.setTextColor(...GOLD);
  doc.text("Shark_Tech", margin + 2, ph - 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(150, 165, 185);
  doc.text("powered by Shark_Tech  ·  Stock Guardian", margin + 2, ph - 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(150, 165, 185);
  doc.text(`Página ${pageNum} de ${totalPages}`, pw - margin, ph - 10, { align: "right" });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.5);
  doc.setTextColor(...GOLD);
  doc.text("Documento gerado automaticamente — Stock Guardian", pw - margin, ph - 5, { align: "right" });
}

function drawTableHeader(
  doc: jsPDF,
  columns: PdfColumn[],
  colWidths: number[],
  y: number,
  margin: number
) {
  let x = margin;

  doc.setFillColor(...NAVY);
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  doc.rect(margin, y - 4.5, totalW, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  columns.forEach((col, i) => {
    const align = col.align || "left";
    const tx = align === "center" ? x + colWidths[i] / 2 : align === "right" ? x + colWidths[i] - 2 : x + 2;
    doc.text(col.header, tx, y, { align });
    x += colWidths[i];
  });

  return y + 6;
}

function drawTableRow(
  doc: jsPDF,
  columns: PdfColumn[],
  row: Record<string, string | number>,
  colWidths: number[],
  y: number,
  margin: number,
  isEven: boolean
) {
  let x = margin;
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const rowH = 6.5;

  if (isEven) {
    doc.setFillColor(248, 249, 252);
    doc.rect(margin, y - 4, totalW, rowH, "F");
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...DARK);

  columns.forEach((col, i) => {
    const val = String(row[col.key] ?? "");
    const align = col.align || "left";
    const tx = align === "center" ? x + colWidths[i] / 2 : align === "right" ? x + colWidths[i] - 2 : x + 2;
    const trimmed = doc.splitTextToSize(val, colWidths[i] - 3)[0] || "";
    doc.text(trimmed, tx, y, { align });
    x += colWidths[i];
  });

  doc.setDrawColor(220, 225, 235);
  doc.setLineWidth(0.2);
  doc.line(margin, y + 2.5, margin + totalW, y + 2.5);

  return rowH;
}

export function gerarPDF(options: PdfOptions): void {
  const {
    title,
    subtitle,
    columns,
    rows,
    filename,
    orientation = "portrait",
  } = options;

  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  });

  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 14;
  const footerReserve = 26;
  const usableW = pw - margin * 2;

  const totalRelativeW = columns.reduce((s, c) => s + (c.width || 1), 0);
  const colWidths = columns.map((c) => usableW * ((c.width || 1) / totalRelativeW));

  let currentPage = 1;
  const estimatedTotal = Math.ceil(rows.length / 30) + 1;

  function startPage(isFirst = false) {
    if (!isFirst) doc.addPage();
    drawWatermark(doc);
    drawHeader(doc, title, subtitle);
    drawFooter(doc, currentPage, estimatedTotal);
    return 38;
  }

  let y = startPage(true);

  y = drawTableHeader(doc, columns, colWidths, y, margin);

  rows.forEach((row, idx) => {
    if (y + 10 > ph - footerReserve) {
      currentPage++;
      y = startPage();
      y = drawTableHeader(doc, columns, colWidths, y, margin);
    }
    const rowH = drawTableRow(doc, columns, row, colWidths, y, margin, idx % 2 === 0);
    y += rowH;
  });

  if (rows.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY_TEXT);
    doc.text("Nenhum dado disponível para exportação.", pw / 2, y + 10, { align: "center" });
  }

  const totalPagesActual = doc.getNumberOfPages();
  for (let p = 1; p <= totalPagesActual; p++) {
    doc.setPage(p);
    drawFooter(doc, p, totalPagesActual);
  }

  const fname = filename || `${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fname);
}

export function gerarPDFSecao(
  title: string,
  subtitle: string,
  sections: Array<{
    label: string;
    columns: PdfColumn[];
    rows: Record<string, string | number>[];
  }>,
  filename?: string
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 14;
  const footerReserve = 26;
  const usableW = pw - margin * 2;

  let currentPage = 1;

  function startPage(isFirst = false) {
    if (!isFirst) doc.addPage();
    drawWatermark(doc);
    drawHeader(doc, title, subtitle);
    drawFooter(doc, currentPage, 99);
    return 38;
  }

  let y = startPage(true);

  sections.forEach((section) => {
    if (y + 20 > ph - footerReserve) {
      currentPage++;
      y = startPage();
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    doc.text(section.label, margin, y);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 1.5, margin + usableW, y + 1.5);
    y += 7;

    const totalRelativeW = section.columns.reduce((s, c) => s + (c.width || 1), 0);
    const colWidths = section.columns.map((c) => usableW * ((c.width || 1) / totalRelativeW));

    y = drawTableHeader(doc, section.columns, colWidths, y, margin);

    section.rows.forEach((row, idx) => {
      if (y + 10 > ph - footerReserve) {
        currentPage++;
        y = startPage();
        y = drawTableHeader(doc, section.columns, colWidths, y, margin);
      }
      const rowH = drawTableRow(doc, section.columns, row, colWidths, y, margin, idx % 2 === 0);
      y += rowH;
    });

    y += 8;
  });

  const totalPagesActual = doc.getNumberOfPages();
  for (let p = 1; p <= totalPagesActual; p++) {
    doc.setPage(p);
    drawFooter(doc, p, totalPagesActual);
  }

  const fname = filename || `${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fname);
}
