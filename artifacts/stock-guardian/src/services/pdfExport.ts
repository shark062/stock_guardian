import { jsPDF } from "jspdf";
import mercadaoLogoUrl from "@assets/POWERED_BY_SHARK_TECH_20260409_064424_0000_1775728041239.png";

const NAVY = [10, 31, 68] as const;
const GOLD = [201, 161, 74] as const;
const GRAY_TEXT = [100, 110, 130] as const;
const DARK = [28, 28, 28] as const;
const ROW_EVEN = [247, 249, 252] as const;

const mercadaoImg = new Image();
mercadaoImg.src = mercadaoLogoUrl;

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
  if (!mercadaoImg.complete || mercadaoImg.naturalWidth === 0) return;

  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  const logoW = 110;
  const logoH = (mercadaoImg.naturalHeight / mercadaoImg.naturalWidth) * logoW;
  const cx = (pw - logoW) / 2;
  const cy = (ph - logoH) / 2;

  doc.saveGraphicsState();
  doc.setGState(doc.GState({ opacity: 0.1 }));
  doc.addImage(mercadaoImg, "PNG", cx, cy, logoW, logoH);
  doc.restoreGraphicsState();
}

function drawHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pw = doc.internal.pageSize.getWidth();
  const margin = 14;
  const headerH = 32;

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pw, headerH, "F");

  doc.setFillColor(...GOLD);
  doc.rect(margin, 9, 3, 16, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(title, margin + 8, 19);

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GOLD);
    doc.text(subtitle, margin + 8, 27);
  }

  const dateStr = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(160, 178, 205);
  doc.text(`Gerado em ${dateStr}`, pw - margin, 22, { align: "right" });

  return headerH + 8;
}

function drawFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 14;
  const footerY = ph - 20;

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pw - margin, footerY);

  doc.setFillColor(...NAVY);
  doc.rect(0, footerY + 0.8, pw, 20, "F");

  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(10);
  doc.setTextColor(...GOLD);
  doc.text("Stock Guardian", margin + 2, ph - 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(140, 158, 180);
  doc.text("Mercadão Frios, Embalagens e +!  ·  Stock Guardian", margin + 2, ph - 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(140, 158, 180);
  doc.text(`Página ${pageNum} de ${totalPages}`, pw - margin, ph - 11, { align: "right" });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(6);
  doc.setTextColor(...GOLD);
  doc.text("Documento gerado automaticamente — Stock Guardian", pw - margin, ph - 5, { align: "right" });
}

function drawSectionTitle(doc: jsPDF, label: string, y: number, margin: number, usableW: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text(label, margin, y);

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 2, margin + usableW, y + 2);

  return y + 10;
}

function drawTableHeader(
  doc: jsPDF,
  columns: PdfColumn[],
  colWidths: number[],
  y: number,
  margin: number
): number {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const rowH = 9;

  doc.setFillColor(...NAVY);
  doc.rect(margin, y, totalW, rowH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  let x = margin;
  columns.forEach((col, i) => {
    const align = col.align || "left";
    const tx =
      align === "center"
        ? x + colWidths[i] / 2
        : align === "right"
          ? x + colWidths[i] - 3
          : x + 3;
    doc.text(col.header, tx, y + 6, { align });
    x += colWidths[i];
  });

  return y + rowH;
}

function drawTableRow(
  doc: jsPDF,
  columns: PdfColumn[],
  row: Record<string, string | number>,
  colWidths: number[],
  y: number,
  margin: number,
  isEven: boolean
): number {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const rowH = 7.5;

  if (isEven) {
    doc.setFillColor(...ROW_EVEN);
    doc.rect(margin, y, totalW, rowH, "F");
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...DARK);

  let x = margin;
  columns.forEach((col, i) => {
    const val = String(row[col.key] ?? "");
    const align = col.align || "left";
    const tx =
      align === "center"
        ? x + colWidths[i] / 2
        : align === "right"
          ? x + colWidths[i] - 3
          : x + 3;
    const trimmed = doc.splitTextToSize(val, colWidths[i] - 5)[0] || "";
    doc.text(trimmed, tx, y + 5, { align });
    x += colWidths[i];
  });

  doc.setDrawColor(218, 224, 234);
  doc.setLineWidth(0.2);
  doc.line(margin, y + rowH, margin + totalW, y + rowH);

  return rowH;
}

export function gerarPDF(options: PdfOptions): void {
  const { title, subtitle, columns, rows, filename, orientation = "portrait" } = options;

  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });

  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 14;
  const footerReserve = 24;
  const usableW = pw - margin * 2;

  const totalRelativeW = columns.reduce((s, c) => s + (c.width || 1), 0);
  const colWidths = columns.map((c) => usableW * ((c.width || 1) / totalRelativeW));

  let currentPage = 1;
  const estimatedTotal = Math.ceil(rows.length / 30) + 1;

  function startPage(isFirst = false): number {
    if (!isFirst) doc.addPage();
    drawWatermark(doc);
    const contentStart = drawHeader(doc, title, subtitle);
    drawFooter(doc, currentPage, estimatedTotal);
    return contentStart;
  }

  let y = startPage(true);
  y = drawTableHeader(doc, columns, colWidths, y, margin);

  rows.forEach((row, idx) => {
    if (y + 12 > ph - footerReserve) {
      currentPage++;
      y = startPage();
      y = drawTableHeader(doc, columns, colWidths, y, margin);
    }
    y += drawTableRow(doc, columns, row, colWidths, y, margin, idx % 2 === 0);
  });

  if (rows.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY_TEXT);
    doc.text("Nenhum dado disponível para exportação.", pw / 2, y + 14, { align: "center" });
  }

  const totalPagesActual = doc.getNumberOfPages();
  for (let p = 1; p <= totalPagesActual; p++) {
    doc.setPage(p);
    drawFooter(doc, p, totalPagesActual);
  }

  const fname =
    filename ||
    `${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
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
  const footerReserve = 24;
  const usableW = pw - margin * 2;

  let currentPage = 1;
  let totalPages = 1;

  function startPage(isFirst = false): number {
    if (!isFirst) doc.addPage();
    drawWatermark(doc);
    const contentStart = drawHeader(doc, title, subtitle);
    drawFooter(doc, currentPage, 99);
    return contentStart;
  }

  let y = startPage(true);

  sections.forEach((section) => {
    if (y + 28 > ph - footerReserve) {
      currentPage++;
      y = startPage();
    }

    y = drawSectionTitle(doc, section.label, y, margin, usableW);

    const totalRelativeW = section.columns.reduce((s, c) => s + (c.width || 1), 0);
    const colWidths = section.columns.map(
      (c) => usableW * ((c.width || 1) / totalRelativeW)
    );

    y = drawTableHeader(doc, section.columns, colWidths, y, margin);

    section.rows.forEach((row, idx) => {
      if (y + 12 > ph - footerReserve) {
        currentPage++;
        y = startPage();
        y = drawTableHeader(doc, section.columns, colWidths, y, margin);
      }
      y += drawTableRow(doc, section.columns, row, colWidths, y, margin, idx % 2 === 0);
    });

    if (section.rows.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(...GRAY_TEXT);
      doc.text("Sem dados.", margin + 3, y + 6);
      y += 10;
    }

    y += 10;
  });

  totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, p, totalPages);
  }

  const fname =
    filename ||
    `${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fname);
}
