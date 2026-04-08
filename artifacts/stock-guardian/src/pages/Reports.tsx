import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { StatusBadge } from "@/components/StatusBadge";
import { mockProducts, getProductStatus, getDaysToExpire, ProductStatus } from "@/services/mockData";
import { FileText, Download, Filter, Calendar, Package } from "lucide-react";

type StatusFilter = "todos" | ProductStatus;

export default function Reports() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [categoria, setCategoria] = useState("");

  const categorias = useMemo(() => {
    const cats = new Set(mockProducts.map((p) => p.categoria));
    return Array.from(cats).sort();
  }, []);

  const filtered = useMemo(() => {
    return mockProducts.filter((p) => {
      const status = getProductStatus(p.validade);
      const matchStatus = statusFilter === "todos" || status === statusFilter;

      const valDate = new Date(p.validade + "T00:00:00");
      const matchInicio = !dataInicio || valDate >= new Date(dataInicio);
      const matchFim = !dataFim || valDate <= new Date(dataFim + "T23:59:59");
      const matchCategoria = !categoria || p.categoria === categoria;

      return matchStatus && matchInicio && matchFim && matchCategoria;
    });
  }, [statusFilter, dataInicio, dataFim, categoria]);

  const summary = useMemo(() => {
    const vencidos = filtered.filter((p) => getProductStatus(p.validade) === "vencido");
    const criticos = filtered.filter((p) => getProductStatus(p.validade) === "critico");
    const atencao = filtered.filter((p) => getProductStatus(p.validade) === "atencao");
    const totalPerda = vencidos.reduce((acc, p) => acc + p.preco * p.quantidade, 0);
    return { vencidos: vencidos.length, criticos: criticos.length, atencao: atencao.length, totalPerda };
  }, [filtered]);

  const handleExport = () => {
    const rows = [
      ["Nome", "Código", "Categoria", "Preço", "Quantidade", "Validade", "Status", "Dias"],
      ...filtered.map((p) => {
        const status = getProductStatus(p.validade);
        const days = getDaysToExpire(p.validade);
        return [
          p.nome,
          p.codigoBarras,
          p.categoria,
          `R$ ${p.preco.toFixed(2)}`,
          String(p.quantidade),
          new Date(p.validade + "T00:00:00").toLocaleDateString("pt-BR"),
          status,
          String(days),
        ];
      }),
    ];
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-guardian-relatorio-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: "todos", label: "Todos os Status" },
    { value: "ok", label: "OK" },
    { value: "atencao", label: "Atenção" },
    { value: "critico", label: "Crítico" },
    { value: "vencido", label: "Vencido" },
  ];

  return (
    <Layout title="Relatórios">
      <div className="space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Filtrados", value: filtered.length, color: "text-foreground" },
            { label: "Vencidos", value: summary.vencidos, color: "text-red-600" },
            { label: "Críticos", value: summary.criticos, color: "text-orange-600" },
            { label: "Perda Estimada", value: `R$ ${summary.totalPerda.toFixed(2).replace(".", ",")}`, color: "text-red-700" },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-xl border border-card-border p-4 shadow-sm animate-fade-in">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-card-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm text-foreground">Filtros</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="select-status-filter"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" />
                Validade de
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="input-data-inicio"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" />
                Validade até
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="input-data-fim"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="select-categoria"
              >
                <option value="">Todas</option>
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-sm text-foreground">{filtered.length} produto(s)</span>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
              data-testid="btn-export"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Produto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Categoria</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preço</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Qtd.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Validade</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      Nenhum produto encontrado com os filtros aplicados
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
                    const status = getProductStatus(p.validade);
                    const days = getDaysToExpire(p.validade);
                    const rowBg =
                      status === "vencido"
                        ? "bg-red-50/50 dark:bg-red-950/20"
                        : status === "critico"
                        ? "bg-orange-50/50 dark:bg-orange-950/20"
                        : "";
                    return (
                      <tr key={p.id} className={`hover:bg-muted/30 transition-colors ${rowBg}`} data-testid={`report-row-${p.id}`}>
                        <td className="px-5 py-3">
                          <div className="font-medium text-foreground">{p.nome}</div>
                          <div className="text-xs text-muted-foreground font-mono">{p.codigoBarras}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">{p.categoria}</td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                          R$ {p.preco.toFixed(2).replace(".", ",")}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">{p.quantidade}</td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {new Date(p.validade + "T00:00:00").toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={status} showDays={days} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
