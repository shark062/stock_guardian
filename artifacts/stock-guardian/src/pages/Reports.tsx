import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { StatusBadge } from "@/components/StatusBadge";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  mockProducts,
  getProductStatus,
  getDaysToExpire,
  ProductStatus,
} from "@/services/mockData";
import {
  FileText,
  Download,
  Filter,
  Calendar,
  Package,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Target,
  ShieldAlert,
  DollarSign,
  Layers,
  PrinterIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Aba = "financeiro" | "perdas" | "detalhado";
type StatusFilter = "todos" | ProductStatus;

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pct(val: number) {
  return `${val.toFixed(1)}%`;
}

export default function Reports() {
  const { isAdmin } = useAuth();
  const { lots, reposicoes, eficienciaUsuarios, produtosEmRisco, valorTotalEmRisco } = useStore();

  const [aba, setAba] = useState<Aba>("financeiro");
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

  const analiseFinanceira = useMemo(() => {
    const vencidos = mockProducts.filter((p) => getProductStatus(p.validade) === "vencido");
    const criticos = mockProducts.filter((p) => getProductStatus(p.validade) === "critico");
    const atencao = mockProducts.filter((p) => getProductStatus(p.validade) === "atencao");

    const perdaVencidos = vencidos.reduce((acc, p) => acc + p.custo * p.quantidade, 0);
    const perdaEmRisco = criticos.reduce((acc, p) => acc + p.custo * p.quantidade, 0);
    const perdaAtencao = atencao.reduce((acc, p) => acc + p.custo * p.quantidade * 0.5, 0);

    const margemBrutaTotal = lots.reduce(
      (acc, l) => acc + (l.precoVenda - l.custo) * l.quantidade,
      0
    );
    const custoTotalEstoque = lots.reduce((acc, l) => acc + l.custo * l.quantidade, 0);
    const margemPct = custoTotalEstoque > 0 ? (margemBrutaTotal / custoTotalEstoque) * 100 : 0;

    const totalReposicoes = reposicoes.length;
    const errosFifo = reposicoes.filter((r) => r.erro_fifo).length;
    const taxaFifo = totalReposicoes > 0 ? ((totalReposicoes - errosFifo) / totalReposicoes) * 100 : 100;

    const porCategoria = categorias.map((cat) => {
      const prods = mockProducts.filter((p) => p.categoria === cat);
      const lotsCategoria = lots.filter((l) =>
        prods.some((p) => p.codigoBarras === l.produtoCodigo)
      );
      const margem = lotsCategoria.reduce(
        (acc, l) => acc + (l.precoVenda - l.custo) * l.quantidade,
        0
      );
      const custo = lotsCategoria.reduce((acc, l) => acc + l.custo * l.quantidade, 0);
      const margemPctCat = custo > 0 ? (margem / custo) * 100 : 0;
      const emRisco = prods.filter((p) => {
        const s = getProductStatus(p.validade);
        return s === "vencido" || s === "critico";
      });
      const perdaCat = emRisco.reduce((acc, p) => acc + p.custo * p.quantidade, 0);

      return {
        categoria: cat,
        produtos: prods.length,
        margem,
        margemPct: margemPctCat,
        emRisco: emRisco.length,
        perda: perdaCat,
        custo,
      };
    }).sort((a, b) => b.perda - a.perda);

    const maxPerda = Math.max(...porCategoria.map((c) => c.perda), 1);
    const maxMargem = Math.max(...porCategoria.map((c) => Math.abs(c.margem)), 1);

    return {
      vencidos,
      criticos,
      atencao,
      perdaVencidos,
      perdaEmRisco,
      perdaAtencao,
      perdaTotal: perdaVencidos + perdaEmRisco,
      margemBrutaTotal,
      margemPct,
      taxaFifo,
      errosFifo,
      totalReposicoes,
      porCategoria,
      maxPerda,
      maxMargem,
    };
  }, [lots, reposicoes, categorias]);

  const handleExportCompleto = () => {
    const linhas: string[][] = [];

    linhas.push(["=== RELATÓRIO FINANCEIRO STOCK GUARDIAN ===", "", ""]);
    linhas.push(["Gerado em:", new Date().toLocaleString("pt-BR"), ""]);
    linhas.push(["", "", ""]);

    linhas.push(["=== KPIs GERAIS ===", "", ""]);
    linhas.push(["Perda Confirmada (vencidos)", fmt(analiseFinanceira.perdaVencidos), ""]);
    linhas.push(["Perda em Risco (críticos)", fmt(analiseFinanceira.perdaEmRisco), ""]);
    linhas.push(["Perda Total Estimada", fmt(analiseFinanceira.perdaTotal), ""]);
    linhas.push(["Margem Bruta Estimada", fmt(analiseFinanceira.margemBrutaTotal), ""]);
    linhas.push(["Margem %", pct(analiseFinanceira.margemPct), ""]);
    linhas.push(["Taxa FIFO", pct(analiseFinanceira.taxaFifo), ""]);
    linhas.push(["", "", ""]);

    linhas.push(["=== ANÁLISE POR CATEGORIA ===", "", ""]);
    linhas.push(["Categoria", "Margem Bruta", "Perda", "Margem %", "Em Risco"]);
    analiseFinanceira.porCategoria.forEach((c) => {
      linhas.push([
        c.categoria,
        fmt(c.margem),
        fmt(c.perda),
        pct(c.margemPct),
        String(c.emRisco),
      ]);
    });
    linhas.push(["", "", ""]);

    linhas.push(["=== PRODUTOS VENCIDOS (PERDA CONFIRMADA) ===", "", ""]);
    linhas.push(["Produto", "Qtd.", "Custo Unit.", "Perda Total"]);
    analiseFinanceira.vencidos.forEach((p) => {
      linhas.push([p.nome, String(p.quantidade), fmt(p.custo), fmt(p.custo * p.quantidade)]);
    });
    linhas.push(["", "", ""]);

    linhas.push(["=== EFICIÊNCIA FIFO POR USUÁRIO ===", "", ""]);
    linhas.push(["Usuário", "Total Reposições", "Erros FIFO", "Eficiência %"]);
    eficienciaUsuarios.forEach((u) => {
      linhas.push([u.usuarioNome, String(u.total), String(u.erros), pct(u.eficiencia)]);
    });

    const csv = linhas.map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-financeiro-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDetalhado = () => {
    const rows = [
      ["Nome", "Código", "Categoria", "Preço Venda", "Custo", "Margem R$", "Margem %", "Quantidade", "Validade", "Status", "Dias"],
      ...filtered.map((p) => {
        const status = getProductStatus(p.validade);
        const days = getDaysToExpire(p.validade);
        const margem = p.preco - p.custo;
        const margemPct = p.custo > 0 ? (margem / p.custo) * 100 : 0;
        return [
          p.nome,
          p.codigoBarras,
          p.categoria,
          `R$ ${p.preco.toFixed(2)}`,
          `R$ ${p.custo.toFixed(2)}`,
          `R$ ${margem.toFixed(2)}`,
          `${margemPct.toFixed(1)}%`,
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
    a.download = `relatorio-detalhado-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const kpis = [
    {
      label: "Perda Confirmada",
      sublabel: "Produtos vencidos (custo)",
      value: fmt(analiseFinanceira.perdaVencidos),
      icon: TrendingDown,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-100",
      negativo: true,
    },
    {
      label: "Perda em Risco",
      sublabel: "Críticos próximos ao venc.",
      value: fmt(analiseFinanceira.perdaEmRisco),
      icon: AlertTriangle,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-100",
      negativo: true,
    },
    {
      label: "Margem Bruta",
      sublabel: `${pct(analiseFinanceira.margemPct)} sobre custo`,
      value: fmt(analiseFinanceira.margemBrutaTotal),
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      negativo: false,
    },
    {
      label: "Taxa FIFO",
      sublabel: `${analiseFinanceira.errosFifo} erro(s) de ${analiseFinanceira.totalReposicoes} reposições`,
      value: pct(analiseFinanceira.taxaFifo),
      icon: ShieldAlert,
      color: analiseFinanceira.taxaFifo >= 90 ? "text-emerald-600" : analiseFinanceira.taxaFifo >= 70 ? "text-amber-600" : "text-red-600",
      bg: analiseFinanceira.taxaFifo >= 90 ? "bg-emerald-50" : analiseFinanceira.taxaFifo >= 70 ? "bg-amber-50" : "bg-red-50",
      border: analiseFinanceira.taxaFifo >= 90 ? "border-emerald-100" : analiseFinanceira.taxaFifo >= 70 ? "border-amber-100" : "border-red-100",
      negativo: analiseFinanceira.taxaFifo < 90,
    },
  ];

  return (
    <Layout title="Relatórios">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
            {(
              [
                { key: "financeiro", label: "Análise Financeira", icon: BarChart3 },
                { key: "perdas", label: "Perdas e Riscos", icon: TrendingDown },
                { key: "detalhado", label: "Relatório Detalhado", icon: FileText },
              ] as { key: Aba; label: string; icon: React.ElementType }[]
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setAba(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer",
                  aba === tab.key
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {isAdmin && (
            <button
              onClick={handleExportCompleto}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}
            >
              <PrinterIcon className="w-3.5 h-3.5" />
              Exportar Relatório Completo
            </button>
          )}
        </div>

        {aba === "financeiro" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {kpis.map((kpi, i) => (
                <div
                  key={i}
                  className={cn(
                    "bg-card rounded-xl border p-4 shadow-sm animate-fade-in",
                    kpi.border
                  )}
                >
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", kpi.bg)}>
                    <kpi.icon className={cn("w-4 h-4", kpi.color)} />
                  </div>
                  <p className={cn("text-xl font-bold", kpi.color)}>{kpi.value}</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">{kpi.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.sublabel}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="font-semibold text-sm text-foreground">Perda por Categoria</span>
                  <span className="ml-auto text-[10px] text-muted-foreground uppercase tracking-wide">Custo perdido (R$)</span>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {analiseFinanceira.porCategoria
                    .filter((c) => c.perda > 0)
                    .slice(0, 7)
                    .map((cat) => (
                      <div key={cat.categoria}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-foreground">{cat.categoria}</span>
                          <div className="flex items-center gap-2">
                            {cat.emRisco > 0 && (
                              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                                {cat.emRisco} em risco
                              </span>
                            )}
                            <span className="text-xs font-bold text-red-600">{fmt(cat.perda)}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-red-400 transition-all"
                            style={{ width: `${(cat.perda / analiseFinanceira.maxPerda) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  {analiseFinanceira.porCategoria.filter((c) => c.perda > 0).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma perda registrada</p>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="font-semibold text-sm text-foreground">Margem Bruta por Categoria</span>
                  <span className="ml-auto text-[10px] text-muted-foreground uppercase tracking-wide">Lucro bruto (R$)</span>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {[...analiseFinanceira.porCategoria]
                    .sort((a, b) => b.margem - a.margem)
                    .slice(0, 7)
                    .map((cat) => (
                      <div key={cat.categoria}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-foreground">{cat.categoria}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">{pct(cat.margemPct)}</span>
                            <span className={cn("text-xs font-bold", cat.margem >= 0 ? "text-emerald-600" : "text-red-600")}>
                              {fmt(cat.margem)}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-400 transition-all"
                            style={{ width: `${(Math.abs(cat.margem) / analiseFinanceira.maxMargem) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm text-foreground">Pontos de Ação Prioritários</span>
                </div>
                <div className="divide-y divide-border">
                  {analiseFinanceira.vencidos.slice(0, 5).map((p, i) => (
                    <div key={p.id} className="px-5 py-3 flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">{p.categoria} — {p.quantidade} un.</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-red-600">{fmt(p.custo * p.quantidade)}</p>
                        <p className="text-[10px] text-red-500">perda confirmada</p>
                      </div>
                    </div>
                  ))}
                  {analiseFinanceira.vencidos.length === 0 && (
                    <div className="px-5 py-8 text-center text-muted-foreground text-sm">
                      Nenhum produto vencido
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-sm text-foreground">Eficiência FIFO por Usuário</span>
                </div>
                <div className="divide-y divide-border">
                  {eficienciaUsuarios.length === 0 ? (
                    <div className="px-5 py-8 text-center text-muted-foreground text-sm">
                      Nenhuma reposição registrada
                    </div>
                  ) : (
                    eficienciaUsuarios.map((u) => (
                      <div key={u.usuario} className="px-5 py-3 flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}
                        >
                          {u.usuarioNome.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{u.usuarioNome}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  u.eficiencia >= 90 ? "bg-emerald-400" :
                                  u.eficiencia >= 70 ? "bg-amber-400" : "bg-red-400"
                                )}
                                style={{ width: `${u.eficiencia}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={cn(
                            "text-sm font-bold",
                            u.eficiencia >= 90 ? "text-emerald-600" :
                            u.eficiencia >= 70 ? "text-amber-600" : "text-red-600"
                          )}>
                            {pct(u.eficiencia)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{u.erros} erro(s) / {u.total}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-card-border shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-sm text-foreground">Resumo Executivo por Categoria</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40">
                      <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Categoria</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Produtos</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Margem R$</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Margem %</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Perda R$</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {analiseFinanceira.porCategoria.map((cat) => {
                      const resultado = cat.margem - cat.perda;
                      return (
                        <tr key={cat.categoria} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5 font-medium text-foreground">{cat.categoria}</td>
                          <td className="px-4 py-2.5 text-right text-muted-foreground">{cat.produtos}</td>
                          <td className="px-4 py-2.5 text-right text-emerald-600 font-semibold">{fmt(cat.margem)}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={cn(
                              "text-xs font-semibold px-1.5 py-0.5 rounded",
                              cat.margemPct >= 30 ? "bg-emerald-100 text-emerald-700" :
                              cat.margemPct >= 15 ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            )}>
                              {pct(cat.margemPct)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-red-600 font-semibold">
                            {cat.perda > 0 ? fmt(cat.perda) : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {resultado >= 0 ? (
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                              )}
                              <span className={cn("font-bold text-sm", resultado >= 0 ? "text-emerald-600" : "text-red-600")}>
                                {fmt(resultado)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/40 font-bold">
                      <td className="px-4 py-2.5 text-foreground">TOTAL</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{mockProducts.length}</td>
                      <td className="px-4 py-2.5 text-right text-emerald-600">{fmt(analiseFinanceira.margemBrutaTotal)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={cn(
                          "text-xs font-semibold px-1.5 py-0.5 rounded",
                          analiseFinanceira.margemPct >= 30 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {pct(analiseFinanceira.margemPct)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-red-600">{fmt(analiseFinanceira.perdaTotal)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {analiseFinanceira.margemBrutaTotal - analiseFinanceira.perdaTotal >= 0 ? (
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                          )}
                          <span className={cn(
                            "font-bold",
                            analiseFinanceira.margemBrutaTotal - analiseFinanceira.perdaTotal >= 0 ? "text-emerald-600" : "text-red-600"
                          )}>
                            {fmt(analiseFinanceira.margemBrutaTotal - analiseFinanceira.perdaTotal)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}

        {aba === "perdas" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: "Perda Confirmada",
                  sublabel: `${analiseFinanceira.vencidos.length} produto(s) vencido(s)`,
                  value: fmt(analiseFinanceira.perdaVencidos),
                  color: "text-red-600",
                  bg: "bg-red-50",
                  icon: TrendingDown,
                },
                {
                  label: "Risco Imediato",
                  sublabel: `${analiseFinanceira.criticos.length} produto(s) crítico(s)`,
                  value: fmt(analiseFinanceira.perdaEmRisco),
                  color: "text-orange-600",
                  bg: "bg-orange-50",
                  icon: AlertTriangle,
                },
                {
                  label: "Risco Moderado",
                  sublabel: `${analiseFinanceira.atencao.length} produto(s) em atenção`,
                  value: fmt(analiseFinanceira.perdaAtencao),
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                  icon: DollarSign,
                },
              ].map((c) => (
                <div key={c.label} className="bg-card rounded-xl border border-card-border p-4 shadow-sm">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", c.bg)}>
                    <c.icon className={cn("w-4 h-4", c.color)} />
                  </div>
                  <p className={cn("text-2xl font-bold", c.color)}>{c.value}</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{c.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.sublabel}</p>
                </div>
              ))}
            </div>

            {analiseFinanceira.vencidos.length > 0 && (
              <div className="bg-card rounded-xl border border-red-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-red-100 bg-red-50/50 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="font-semibold text-sm text-red-700">Produtos Vencidos — Perda Confirmada</span>
                  <span className="ml-auto text-xs text-red-600 font-bold">{fmt(analiseFinanceira.perdaVencidos)}</span>
                </div>
                <div className="divide-y divide-border">
                  {analiseFinanceira.vencidos.map((p) => {
                    const dias = Math.abs(getDaysToExpire(p.validade));
                    return (
                      <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">{p.nome}</p>
                            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                              Vencido há {dias}d
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.categoria} — {p.quantidade} un. × {fmt(p.custo)} custo
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-red-600">{fmt(p.custo * p.quantidade)}</p>
                          <p className="text-[10px] text-muted-foreground">perda total</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {analiseFinanceira.criticos.length > 0 && (
              <div className="bg-card rounded-xl border border-orange-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-orange-100 bg-orange-50/50 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="font-semibold text-sm text-orange-700">Produtos Críticos — Ação Urgente</span>
                  <span className="ml-auto text-xs text-orange-600 font-bold">{fmt(analiseFinanceira.perdaEmRisco)} em risco</span>
                </div>
                <div className="divide-y divide-border">
                  {analiseFinanceira.criticos.map((p) => {
                    const dias = getDaysToExpire(p.validade);
                    const margem = p.preco - p.custo;
                    const precoPromocional = p.preco * 0.80;
                    return (
                      <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">{p.nome}</p>
                            <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">
                              {dias}d restantes
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.categoria} — {p.quantidade} un. — Sugestão: promoção a {fmt(precoPromocional)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-orange-600">{fmt(p.custo * p.quantidade)}</p>
                          <p className="text-[10px] text-emerald-600">margem unit. {fmt(margem)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {produtosEmRisco.length > 0 && (
              <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-sm text-foreground">Lotes em Risco (próximos 15 dias)</span>
                  <span className="ml-auto text-xs text-red-600 font-bold">{fmt(valorTotalEmRisco)} em risco direto</span>
                </div>
                <div className="divide-y divide-border max-h-64 overflow-y-auto">
                  {produtosEmRisco.map(({ produto, lot, diasRestantes }) => (
                    <div key={lot.id} className="px-5 py-3 flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        diasRestantes <= 0 ? "bg-red-500" :
                        diasRestantes <= 3 ? "bg-orange-500" :
                        diasRestantes <= 7 ? "bg-amber-500" : "bg-yellow-400"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{produto.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          Lote: {lot.quantidade} un. — Validade: {new Date(lot.validade + "T00:00:00").toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn(
                          "text-sm font-bold",
                          diasRestantes <= 3 ? "text-red-600" : "text-orange-600"
                        )}>
                          {diasRestantes <= 0 ? "VENCIDO" : `${diasRestantes}d`}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{fmt(lot.custo * lot.quantidade)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {aba === "detalhado" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Filtrados", value: filtered.length, color: "text-foreground" },
                { label: "Vencidos", value: filtered.filter((p) => getProductStatus(p.validade) === "vencido").length, color: "text-red-600" },
                { label: "Críticos", value: filtered.filter((p) => getProductStatus(p.validade) === "critico").length, color: "text-orange-600" },
                {
                  label: "Perda Estimada",
                  value: fmt(filtered.filter((p) => getProductStatus(p.validade) === "vencido").reduce((acc, p) => acc + p.custo * p.quantidade, 0)),
                  color: "text-red-700",
                },
              ].map((s, i) => (
                <div key={i} className="bg-card rounded-xl border border-card-border p-4 shadow-sm">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

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
                  >
                    {[
                      { value: "todos", label: "Todos os Status" },
                      { value: "ok", label: "OK" },
                      { value: "atencao", label: "Atenção" },
                      { value: "critico", label: "Crítico" },
                      { value: "vencido", label: "Vencido" },
                    ].map((o) => (
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
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Categoria</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Todas</option>
                    {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-sm text-foreground">{filtered.length} produto(s)</span>
                </div>
                <button
                  onClick={handleExportDetalhado}
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
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Custo</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Margem</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Qtd.</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Validade</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                          <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          Nenhum produto encontrado com os filtros aplicados
                        </td>
                      </tr>
                    ) : (
                      filtered.map((p) => {
                        const status = getProductStatus(p.validade);
                        const days = getDaysToExpire(p.validade);
                        const margem = p.preco - p.custo;
                        const margemPct = p.custo > 0 ? (margem / p.custo) * 100 : 0;
                        const rowBg =
                          status === "vencido" ? "bg-red-50/50" :
                          status === "critico" ? "bg-orange-50/50" : "";
                        return (
                          <tr key={p.id} className={cn("hover:bg-muted/30 transition-colors", rowBg)} data-testid={`report-row-${p.id}`}>
                            <td className="px-5 py-3">
                              <div className="font-medium text-foreground">{p.nome}</div>
                              <div className="text-xs text-muted-foreground font-mono">{p.codigoBarras}</div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">{p.categoria}</td>
                            <td className="px-4 py-3 text-right font-semibold text-foreground">
                              {fmt(p.preco)}
                            </td>
                            <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell">
                              {fmt(p.custo)}
                            </td>
                            <td className="px-4 py-3 text-right hidden lg:table-cell">
                              <span className={cn(
                                "text-xs font-semibold px-1.5 py-0.5 rounded",
                                margemPct >= 30 ? "bg-emerald-100 text-emerald-700" :
                                margemPct >= 15 ? "bg-amber-100 text-amber-700" :
                                "bg-red-100 text-red-700"
                              )}>
                                {pct(margemPct)}
                              </span>
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
          </>
        )}
      </div>
    </Layout>
  );
}
