import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { StatusBadge } from "@/components/StatusBadge";
import { ServerConfigPanel } from "@/components/ServerConfig";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { getProductStatus, getDaysToExpire } from "@/services/mockData";
import { getAllProducts, getTotalCount } from "@/services/productsDB";
import { gerarTodasSugestoes } from "@/services/promocoes";
import {
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingDown,
  Clock,
  DollarSign,
  RefreshCw,
  Trophy,
  ShieldAlert,
  Loader2,
  Tag,
  Users,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const { lots, reposicoes, eficienciaUsuarios, produtosEmRisco, valorTotalEmRisco, isSyncing, syncAPI, lastSync, lastSyncSource, notifications } =
    useStore();
  const [showServerCfg, setShowServerCfg] = useState(false);

  const sugestoes = useMemo(() => gerarTodasSugestoes(lots), [lots]);

  const stats = useMemo(() => {
    const all = getAllProducts();
    const total = all.length;
    let vencidos = 0, criticos = 0, atencao = 0, ok = 0;
    for (const p of all) {
      const s = getProductStatus(p.validade);
      if (s === "vencido") vencidos++;
      else if (s === "critico") criticos++;
      else if (s === "atencao") atencao++;
      else ok++;
    }
    return { total, vencidos, criticos, atencao, ok };
  }, []);

  const alertProducts = useMemo(() => {
    const all = getAllProducts();
    return all
      .filter((p) => {
        const s = getProductStatus(p.validade);
        return s === "vencido" || s === "critico";
      })
      .sort((a, b) => new Date(a.validade).getTime() - new Date(b.validade).getTime())
      .slice(0, 6);
  }, []);

  const totalErrosFifo = reposicoes.filter((r) => r.erro_fifo).length;
  const notifNaoLidas = notifications.filter((n) => !n.lida).length;

  async function handleSync() {
    if (isSyncing) return;
    toast.promise(syncAPI(), {
      loading: "Sincronizando com a API externa...",
      success: "Sincronização concluída com sucesso!",
      error: "Erro ao sincronizar. Tente novamente.",
    });
  }

  const cards = [
    {
      label: "Total de Produtos",
      value: stats.total,
      icon: Package,
      color: "hsl(220, 73%, 40%)",
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
      urgent: stats.vencidos > 0,
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

  const extraCards = [
    {
      label: "Em Risco de Perda",
      value: produtosEmRisco.length,
      icon: ShieldAlert,
      color: "hsl(0, 72%, 51%)",
      bg: "hsl(0, 72%, 96%)",
      description: "lotes com vencimento ≤15 dias",
    },
    {
      label: "Valor em Risco",
      value: `R$ ${valorTotalEmRisco.toFixed(2).replace(".", ",")}`,
      icon: DollarSign,
      color: "hsl(0, 72%, 45%)",
      bg: "hsl(0, 72%, 96%)",
      description: "custo dos lotes críticos",
      isText: true,
    },
    {
      label: "Sugestões Promoção",
      value: sugestoes.length,
      icon: Tag,
      color: "hsl(40, 60%, 45%)",
      bg: "hsl(40, 60%, 96%)",
      description: "lotes próximos de vencer",
    },
    {
      label: "Alertas Ativos",
      value: notifNaoLidas,
      icon: AlertTriangle,
      color: "hsl(270, 60%, 50%)",
      bg: "hsl(270, 60%, 96%)",
      description: "notificações não lidas",
    },
  ];

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {lastSync && (
              <p className="text-xs text-muted-foreground">
                Última sinc.: {new Date(lastSync).toLocaleString("pt-BR")}
              </p>
            )}
            {lastSyncSource && (
              <span className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                lastSyncSource === "servidor"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              )}>
                {lastSyncSource === "servidor" ? "Servidor real" : "Dados simulados"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowServerCfg((v) => !v)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer border",
                  showServerCfg
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-muted border-border text-muted-foreground hover:text-foreground"
                )}
                title="Configurações do servidor"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Servidor</span>
              </button>
            )}
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                isSyncing ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:shadow-md"
              )}
              style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isSyncing ? "Sincronizando..." : "Sincronizar"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <div
              key={card.label}
              className={`bg-card rounded-xl p-5 border border-card-border shadow-sm hover:shadow-md transition-shadow animate-fade-in stagger-${i + 1}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: card.bg }}
                >
                  <card.icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                {card.urgent && (
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {extraCards.map((card, i) => (
            <div
              key={card.label}
              className="bg-card rounded-xl p-5 border border-card-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: card.bg }}
                >
                  <card.icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground truncate">{card.value}</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{card.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.description}</p>
            </div>
          ))}
        </div>

        {stats.atencao > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl border animate-fade-in"
            style={{ backgroundColor: "hsl(40, 80%, 96%)", borderColor: "hsl(40, 80%, 85%)" }}
          >
            <Clock className="w-4 h-4 shrink-0" style={{ color: "hsl(40, 80%, 45%)" }} />
            <p className="text-sm font-medium" style={{ color: "hsl(40, 80%, 35%)" }}>
              {stats.atencao} produto(s) vencem em até 30 dias. Verifique a listagem e as sugestões de promoção.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <div key={p.id} className="px-5 py-3 flex items-center gap-3">
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

          {isAdmin && eficienciaUsuarios.length > 0 && (
            <div className="bg-card rounded-xl border border-card-border shadow-sm animate-fade-in stagger-3">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <Trophy className="w-4 h-4" style={{ color: "hsl(40, 54%, 54%)" }} />
                <h3 className="font-semibold text-foreground text-sm">Ranking de Eficiência</h3>
                {totalErrosFifo > 0 && (
                  <span className="ml-auto text-xs bg-red-100 text-red-600 font-medium px-2 py-0.5 rounded-full">
                    {totalErrosFifo} erro(s) FIFO
                  </span>
                )}
              </div>
              <div className="divide-y divide-border">
                {eficienciaUsuarios.slice(0, 5).map((u, idx) => (
                  <div key={u.usuario} className="px-5 py-3 flex items-center gap-3">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        idx === 0 ? "text-white" : "bg-muted text-muted-foreground"
                      )}
                      style={idx === 0 ? { backgroundColor: "hsl(40, 54%, 54%)" } : {}}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.usuarioNome}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 bg-muted rounded-full h-1.5">
                          <div
                            className={cn(
                              "h-1.5 rounded-full transition-all",
                              u.eficiencia >= 90 ? "bg-emerald-500" : u.eficiencia >= 70 ? "bg-amber-500" : "bg-red-500"
                            )}
                            style={{ width: `${u.eficiencia}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-foreground">{u.eficiencia.toFixed(0)}%</p>
                      {u.erros > 0 && (
                        <p className="text-xs text-red-500">{u.erros} erro(s)</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!isAdmin || eficienciaUsuarios.length === 0) && (
            <div className="bg-card rounded-xl border border-card-border shadow-sm animate-fade-in stagger-3">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">Distribuição por Status</h3>
              </div>
              <div className="p-5 space-y-3">
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
                        <div className={`h-1.5 rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {lots.length > 0 && (
          <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">Últimos Lotes Recebidos</h3>
              <span className="ml-auto text-xs text-muted-foreground">{lots.length} lotes</span>
            </div>
            <div className="divide-y divide-border overflow-y-auto" style={{ maxHeight: "240px" }}>
              {lots.slice(0, 8).map((lot) => {
                const status = getProductStatus(lot.validade);
                const days = getDaysToExpire(lot.validade);
                return (
                  <div key={lot.id} className="px-5 py-3 flex items-center gap-3">
                    <div
                      className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full shrink-0",
                        lot.origem === "api"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {lot.origem === "api" ? "API" : "Manual"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{lot.produtoNome}</p>
                      <p className="text-xs text-muted-foreground">
                        {lot.quantidade} un. — Val. {new Date(lot.validade + "T00:00:00").toLocaleDateString("pt-BR")} — Custo R$ {lot.custo.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                    <StatusBadge status={status} showDays={days} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {isAdmin && showServerCfg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={(e) => { if (e.target === e.currentTarget) setShowServerCfg(false); }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
            <ServerConfigPanel onSaved={() => { toast.success("Configuração salva! Clique em Sincronizar para buscar dados do servidor."); setShowServerCfg(false); }} />
          </div>
        </div>
      )}
    </Layout>
  );
}
