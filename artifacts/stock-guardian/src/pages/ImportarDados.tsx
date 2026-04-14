import { useState, useRef, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { applyBulkOverrides, ProductOverride, getProductByBarcode, getAllProducts } from "@/services/productsDB";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  X,
  ChevronDown,
  Download,
  RefreshCw,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ParsedRow {
  barcode: string;
  nome: string;
  preco?: number;
  custo?: number;
  quantidade?: number;
}

interface ImportResult {
  total: number;
  atualizados: number;
  naoEncontrados: string[];
}

function parseXLSHTML(content: string): ParsedRow[] {
  const rows: ParsedRow[] = [];

  const clean = (s: string) =>
    s
      .replace(/<[^>]+>/g, "")
      .trim()
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ");

  const parseNum = (s: string) => {
    if (!s) return undefined;
    const cleaned = s.replace(/[R$\s]/g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    return isNaN(n) ? undefined : n;
  };

  const rowRegex = /<tr[^>]*style="cursor:pointer;"[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;
  while ((match = rowRegex.exec(content)) !== null) {
    const rowHtml = match[1];
    const cells: string[] = [];
    const cr = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let cm;
    while ((cm = cr.exec(rowHtml)) !== null) {
      cells.push(clean(cm[1]));
    }
    if (cells.length >= 4) {
      const barcode = cells[1];
      const nome = cells[2];
      if (!barcode || !nome || nome.length < 2) continue;

      rows.push({
        barcode,
        nome,
        quantidade: parseNum(cells[3]),
        custo: parseNum(cells[4]),
        preco: parseNum(cells[5]),
      });
    }
  }
  return rows;
}

function parseCSV(content: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  const lines = content.split("\n");
  if (lines.length < 2) return rows;

  const parseNum = (s: string) => {
    if (!s) return undefined;
    const cleaned = s.replace(/[R$"'\s]/g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    return isNaN(n) ? undefined : n;
  };

  const header = lines[0].split(/[;,]/).map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  const barcodeIdx = header.findIndex((h) => h.includes("cod") || h.includes("barras") || h.includes("ean"));
  const nomeIdx = header.findIndex((h) => h.includes("nome") || h.includes("descri") || h.includes("produto"));
  const precoIdx = header.findIndex((h) => h.includes("venda") || h.includes("preco") || h.includes("preço"));
  const custoIdx = header.findIndex((h) => h.includes("custo") || h.includes("compra"));
  const qtdIdx = header.findIndex((h) => h.includes("qtd") || h.includes("quant") || h.includes("estoque"));

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/[;,]/).map((c) => c.trim().replace(/"/g, ""));
    if (cols.length < 2) continue;
    const barcode = barcodeIdx >= 0 ? cols[barcodeIdx] : cols[0];
    const nome = nomeIdx >= 0 ? cols[nomeIdx] : cols[1];
    if (!barcode || !nome) continue;

    rows.push({
      barcode,
      nome,
      preco: precoIdx >= 0 ? parseNum(cols[precoIdx]) : undefined,
      custo: custoIdx >= 0 ? parseNum(cols[custoIdx]) : undefined,
      quantidade: qtdIdx >= 0 ? parseNum(cols[qtdIdx]) : undefined,
    });
  }
  return rows;
}

function downloadTemplate() {
  const csv =
    "Codigo de Barras;Nome do Produto;Estoque;Preco de Custo;Preco de Venda\n" +
    "7891000100103;Leite Integral 1L;50;3.50;4.99\n" +
    "7891150022688;Refrigerante Cola 2L;30;4.00;7.49\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modelo-importacao.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportarDados() {
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setParsing(true);
    setResult(null);
    setPreview([]);

    try {
      const content = await file.text();
      let rows: ParsedRow[] = [];

      const ext = file.name.toLowerCase();
      if (ext.endsWith(".xls") || ext.endsWith(".htm") || ext.endsWith(".html")) {
        rows = parseXLSHTML(content);
      } else if (ext.endsWith(".csv") || ext.endsWith(".txt")) {
        rows = parseCSV(content);
      } else {
        toast.error("Formato não suportado. Use .xls, .csv ou .txt");
        setParsing(false);
        return;
      }

      if (rows.length === 0) {
        toast.error("Nenhum produto encontrado no arquivo.");
        setParsing(false);
        return;
      }

      setPreview(rows.slice(0, 10));

      const overrides: ProductOverride[] = [];
      const naoEncontrados: string[] = [];

      rows.forEach((row) => {
        const p = getProductByBarcode(row.barcode);
        if (p) {
          const ov: ProductOverride = { id: p.id };
          if (row.preco !== undefined && row.preco > 0) ov.preco = row.preco;
          if (row.custo !== undefined && row.custo > 0) ov.custo = row.custo;
          if (row.quantidade !== undefined && row.quantidade >= 0) ov.quantidade = row.quantidade;
          if (Object.keys(ov).length > 1) overrides.push(ov);
        } else {
          naoEncontrados.push(`${row.nome} (${row.barcode})`);
        }
      });

      applyBulkOverrides(overrides);

      setResult({
        total: rows.length,
        atualizados: overrides.length,
        naoEncontrados: naoEncontrados.slice(0, 20),
      });

      toast.success(`${overrides.length} produto(s) atualizados com sucesso!`);
    } catch (e) {
      toast.error("Erro ao processar o arquivo. Verifique o formato.");
    } finally {
      setParsing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile]
  );

  return (
    <Layout title="Importar Dados">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="bg-card rounded-2xl border border-card-border shadow-sm p-5">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Info className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Como funciona</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Importe seu arquivo Excel (.xls) ou planilha (.csv) para atualizar preços de venda, custo e
                estoque dos produtos cadastrados. Os produtos são identificados pelo código de barras.
              </p>
            </div>
          </div>

          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:bg-muted transition-colors cursor-pointer mb-5"
          >
            <Download className="w-3.5 h-3.5" />
            Baixar modelo CSV
          </button>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all",
              dragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xls,.xlsx,.csv,.txt,.htm,.html"
              onChange={handleFileChange}
              className="hidden"
            />
            {parsing ? (
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm font-medium text-foreground">Processando arquivo...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <FileSpreadsheet
                  className={cn("w-12 h-12", dragging ? "text-primary" : "text-muted-foreground/50")}
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {dragging ? "Solte o arquivo aqui" : "Clique ou arraste o arquivo"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Suporta .xls (Excel), .csv, .txt
                  </p>
                </div>
                {fileName && (
                  <p className="text-xs text-primary font-medium mt-1">{fileName}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {result && (
          <div className="bg-card rounded-2xl border border-card-border shadow-sm overflow-hidden animate-fade-in">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold text-sm text-foreground">Resultado da Importação</span>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/40 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{result.total}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Linhas lidas</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 text-center border border-emerald-100 dark:border-emerald-900">
                  <p className="text-2xl font-bold text-emerald-600">{result.atualizados}</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Atualizados</p>
                </div>
                <div className={cn("rounded-xl p-3 text-center border", result.naoEncontrados.length > 0 ? "bg-amber-50 dark:bg-amber-950/30 border-amber-100" : "bg-muted/40 border-border")}>
                  <p className={cn("text-2xl font-bold", result.naoEncontrados.length > 0 ? "text-amber-600" : "text-muted-foreground")}>
                    {result.naoEncontrados.length}
                  </p>
                  <p className={cn("text-xs mt-0.5", result.naoEncontrados.length > 0 ? "text-amber-600" : "text-muted-foreground")}>
                    Não encontrados
                  </p>
                </div>
              </div>

              {result.naoEncontrados.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 text-xs text-amber-600 font-medium cursor-pointer hover:text-amber-700 transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Ver produtos não encontrados
                    <ChevronDown className={cn("w-3 h-3 transition-transform", showPreview && "rotate-180")} />
                  </button>
                  {showPreview && (
                    <div className="mt-2 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl p-3 space-y-1 max-h-40 overflow-y-auto">
                      {result.naoEncontrados.map((s, i) => (
                        <p key={i} className="text-xs text-amber-700 flex items-center gap-1.5">
                          <X className="w-3 h-3 shrink-0" />
                          {s}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {preview.length > 0 && !result && (
          <div className="bg-card rounded-2xl border border-card-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <span className="font-semibold text-sm text-foreground">Pré-visualização (primeiras 10 linhas)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="px-4 py-2 text-left text-muted-foreground">Código</th>
                    <th className="px-4 py-2 text-left text-muted-foreground">Nome</th>
                    <th className="px-4 py-2 text-right text-muted-foreground">Custo</th>
                    <th className="px-4 py-2 text-right text-muted-foreground">Venda</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-4 py-2 font-mono text-muted-foreground">{r.barcode}</td>
                      <td className="px-4 py-2 text-foreground truncate max-w-[200px]">{r.nome}</td>
                      <td className="px-4 py-2 text-right">{r.custo ? `R$ ${r.custo.toFixed(2)}` : "-"}</td>
                      <td className="px-4 py-2 text-right">{r.preco ? `R$ ${r.preco.toFixed(2)}` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
