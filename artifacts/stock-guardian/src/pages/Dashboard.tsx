import { useMemo } from "react";
import { Layout } from "@/components/Layout";
import { StatusBadge } from "@/components/StatusBadge";
import { mockProducts, getProductStatus, getDaysToExpire } from "@/services/mockData";
import {
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingDown,
  Clock,
} from "lucide-react";

export default function Dashboard() {
  const stats = useMemo(() => {
    const total = mockProducts.length;
    let vencidos = 0, criticos = 0, atencao = 0, ok = 0;
    for (const p of mockProducts) {
      const s = getProductStatus(p.validade);
      if (s === "vencido") vencidos++;
      else if (s === "critico") criticos++;
      else if (s === "atencao") atencao++;
      else ok++;
    }
    return { total, vencidos, criticos, atencao, ok };
  }, []);

  const alertProducts = useMemo(() =>
    mockProducts
      .filter((p) => {
        const s = getProductStatus(p.validade);
        return s === "vencido" || s === "critico";
      })
      .sort((a, b) => new Date(a.validade).getTime() - new Date(b.validade).getTime())
      .slice(0, 6),
    []
  );

  const recentlyAdded = useMemo(() =>
    [...mockProducts]
      .sort((a, b) => b.id - a.id)
      .slice(0, 5),
    []
  );

  const cards = [
    {
      label: "Total de Produtos",
      value: stats.total,
      icon: Package,
      color: "hsl(220, 73%, 16%)",
      bg: "hsl(220, 73%, 96%)",
      description: "cadastrados no sistema",
    },
    {
      label: "Produtos Vencidos",
      value: stats.vencidos,
      icon: XCircle,
      color: "hsl(0, 72%, 51%)",
      bg: "hsl(0, 72%, 96%)",
      description: "requerem remoção imediata",
    },
    {
      label: "Vencimento Crítico",
      value: stats.criticos,
      icon: AlertTriangle,
      color: "hsl(25, 90%, 50%)",
      bg: "hsl(25, 90%, 96%)",
      description: "vencem em até 7 dias",
    },
    {
      label: "Produtos Ativos",
      value: stats.ok,
      icon: CheckCircle,
      color: "hsl(160, 60%, 35%)",
      bg: "hsl(160, 60%, 96%)",
      description: "dentro da validade",
    },
  ];

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <div
              key={card.label}
              className={`bg-card rounded-xl p-5 border border-card-border shadow-sm hover:shadow-md transition-shadow animate-fade-in stagger-${i + 1}`}
              data-testid={`card-stat-${i}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: card.bg }}
                >
                  <card.icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                {i === 1 && stats.vencidos > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                    Urgente
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-foreground">{card.value}</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{card.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.description}</p>
            </div>
          ))}
        </div>

        {/* Atenção extra */}
        {stats.atencao > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl border animate-fade-in"
            style={{ backgroundColor: "hsl(40, 80%, 96%)", borderColor: "hsl(40, 80%, 85%)" }}
          >
            <Clock className="w-4 h-4 shrink-0" style={{ color: "hsl(40, 80%, 45%)" }} />
            <p className="text-sm font-medium" style={{ color: "hsl(40, 80%, 35%)" }}>
              {stats.atencao} produto(s) vencem em até 30 dias. Verifique a listagem de produtos.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alert products */}
          <div className="bg-card rounded-xl border border-card-border shadow-sm animate-fade-in stagger-2">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" style={{ color: "hsl(25, 90%, 50%)" }} />
              <h3 className="font-semibold text-foreground text-sm">Alertas Urgentes</h3>
              <span className="ml-auto text-xs text-muted-foreground">{alertProducts.length} itens</span>
            </div>
            <div className="divide-y divide-border">
              {alertProducts.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum produto vencido ou crítico</p>
                </div>
              ) : (
                alertProducts.map((p) => {
                  const status = getProductStatus(p.validade);
                  const days = getDaysToExpire(p.validade);
                  return (
                    <div key={p.id} className="px-5 py-3 flex items-center gap-3" data-testid={`alert-product-${p.id}`}>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${status === "vencido" ? "bg-red-500" : "bg-orange-500"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(p.validade + "T00:00:00").toLocaleDateString("pt-BR")} — {p.categoria}
                        </p>
                      </div>
                      <StatusBadge status={status} showDays={days} />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent products */}
          <div className="bg-card rounded-xl border border-card-border shadow-sm animate-fade-in stagger-3">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">Últimos Cadastros</h3>
              <span className="ml-auto text-xs text-muted-foreground">{recentlyAdded.length} itens</span>
            </div>
            <div className="divide-y divide-border">
              {recentlyAdded.map((p) => {
                const status = getProductStatus(p.validade);
                return (
                  <div key={p.id} className="px-5 py-3 flex items-center gap-3" data-testid={`recent-product-${p.id}`}>
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        R$ {p.preco.toFixed(2).replace(".", ",")} — {p.categoria}
                      </p>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Distribution bar */}
        <div className="bg-card rounded-xl border border-card-border shadow-sm p-5 animate-fade-in stagger-4">
          <h3 className="font-semibold text-foreground text-sm mb-4">Distribuição por Status</h3>
          <div className="space-y-3">
            {[
              { label: "OK", count: stats.ok, total: stats.total, color: "bg-emerald-500" },
              { label: "Atenção (até 30 dias)", count: stats.atencao, total: stats.total, color: "bg-amber-500" },
              { label: "Crítico (até 7 dias)", count: stats.criticos, total: stats.total, color: "bg-orange-500" },
              { label: "Vencido", count: stats.vencidos, total: stats.total, color: "bg-red-500" },
            ].map(({ label, count, total, color }) => {
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold text-foreground">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${color} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
