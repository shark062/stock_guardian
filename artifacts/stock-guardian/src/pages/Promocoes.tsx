import { useMemo } from "react";
import { Layout } from "@/components/Layout";
import { useStore } from "@/contexts/StoreContext";
import {
  gerarTodasSugestoes,
  calcularValorTotalEmRisco,
  labelNivel,
  labelRisco,
  NivelPromocao,
  RiscoPerda,
} from "@/services/promocoes";
import {
  Tag,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Clock,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const corNivel: Record<NivelPromocao, string> = {
  urgente: "bg-red-100 text-red-700 border-red-200",
  baixa: "bg-orange-100 text-orange-700 border-orange-200",
  leve: "bg-amber-100 text-amber-700 border-amber-200",
  normal: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const corRisco: Record<RiscoPerda, string> = {
  critico: "text-red-600",
  alto: "text-orange-600",
  moderado: "text-amber-600",
  ok: "text-emerald-600",
};

const bgRisco: Record<RiscoPerda, string> = {
  critico: "bg-red-50 border-red-200",
  alto: "bg-orange-50 border-orange-200",
  moderado: "bg-amber-50 border-amber-200",
  ok: "bg-emerald-50 border-emerald-200",
};

export default function Promocoes() {
  const { lots, produtosEmRisco, valorTotalEmRisco } = useStore();

  const sugestoes = useMemo(() => gerarTodasSugestoes(lots), [lots]);
  const totalRiscoCalculado = useMemo(() => calcularValorTotalEmRisco(sugestoes), [sugestoes]);

  const urgentes = sugestoes.filter((s) => s.nivel === "urgente");
  const demais = sugestoes.filter((s) => s.nivel !== "urgente");

  return (
    <Layout title="Promoções Inteligentes">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-card-border shadow-sm p-5">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
              <Tag className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-foreground">{sugestoes.length}</p>
            <p className="text-sm font-medium text-foreground mt-0.5">Sugestões Ativas</p>
            <p className="text-xs text-muted-foreground mt-0.5">produtos próximos do vencimento</p>
          </div>

          <div className="bg-card rounded-xl border border-card-border shadow-sm p-5">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-foreground">{urgentes.length}</p>
            <p className="text-sm font-medium text-foreground mt-0.5">Ação Urgente</p>
            <p className="text-xs text-muted-foreground mt-0.5">vencem em até 3 dias</p>
          </div>

          <div className="bg-card rounded-xl border border-card-border shadow-sm p-5">
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5 text-rose-500" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              R$ {totalRiscoCalculado.toFixed(2).replace(".", ",")}
            </p>
            <p className="text-sm font-medium text-foreground mt-0.5">Valor em Risco</p>
            <p className="text-xs text-muted-foreground mt-0.5">custo dos lotes críticos</p>
          </div>
        </div>

        {urgentes.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <h3 className="text-sm font-bold text-red-700">Ação Urgente — Vence em até 3 dias</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {urgentes.map((s) => (
                <div key={s.lotId} className="bg-white border border-red-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{s.produtoNome}</p>
                      <p className="text-xs text-muted-foreground">{s.produtoCodigo}</p>
                    </div>
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", corNivel[s.nivel])}>
                      {labelNivel[s.nivel]}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <p className="text-muted-foreground">Validade</p>
                      <p className="font-semibold text-red-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {s.diasRestantes <= 0 ? "Vencido" : `${s.diasRestantes} dia(s)`}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Risco</p>
                      <p className={cn("font-semibold", corRisco[s.riscoPerda])}>
                        {labelRisco[s.riscoPerda]}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Preço atual</p>
                      <p className="font-semibold line-through text-muted-foreground">
                        R$ {s.precoOriginal.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Preço sugerido</p>
                      <p className="font-bold" style={{ color: "hsl(40, 54%, 45%)" }}>
                        R$ {s.precoSugerido.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Desconto: <strong className="text-red-600">{s.descontoPercentual.toFixed(1)}%</strong>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Em risco: <strong className="text-red-600">R$ {s.valorEmRisco.toFixed(2).replace(".", ",")}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {demais.length > 0 && (
          <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <TrendingDown className="w-4 h-4" style={{ color: "hsl(40, 54%, 54%)" }} />
              <h3 className="font-semibold text-foreground text-sm">Sugestões de Promoção</h3>
              <span className="ml-auto text-xs text-muted-foreground">{demais.length} produtos</span>
            </div>
            <div className="divide-y divide-border">
              {demais.map((s) => (
                <div key={s.lotId} className="px-5 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-foreground truncate">{s.produtoNome}</p>
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border shrink-0", corNivel[s.nivel])}>
                        {labelNivel[s.nivel]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Vence em{" "}
                      <span className={cn("font-semibold", s.diasRestantes <= 7 ? "text-orange-600" : "text-amber-600")}>
                        {s.diasRestantes} dia(s)
                      </span>{" "}
                      — {new Date(s.validade + "T00:00:00").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground line-through">
                      R$ {s.precoOriginal.toFixed(2).replace(".", ",")}
                    </p>
                    <p className="text-base font-bold" style={{ color: "hsl(40, 54%, 45%)" }}>
                      R$ {s.precoSugerido.toFixed(2).replace(".", ",")}
                    </p>
                    <p className="text-xs text-muted-foreground">-{s.descontoPercentual.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sugestoes.length === 0 && (
          <div className="bg-card rounded-xl border border-card-border shadow-sm py-16 text-center">
            <Tag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Nenhuma sugestão de promoção</p>
            <p className="text-xs text-muted-foreground mt-1">
              Todos os lotes cadastrados estão com validade superior a 15 dias.
            </p>
          </div>
        )}

        {produtosEmRisco.length > 0 && (
          <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold text-foreground text-sm">Produtos em Risco de Perda</h3>
              <span className="ml-auto text-xs text-muted-foreground">{produtosEmRisco.length} lotes</span>
            </div>
            <div className="divide-y divide-border">
              {produtosEmRisco.map((item) => {
                const isVencido = item.diasRestantes < 0;
                const bgClass = isVencido
                  ? "bg-red-50 border-red-200"
                  : item.diasRestantes <= 3
                  ? "bg-red-50/50"
                  : item.diasRestantes <= 7
                  ? "bg-orange-50/50"
                  : "";

                return (
                  <div key={item.lot.id} className={cn("px-5 py-3 flex items-center gap-3", bgClass)}>
                    <div
                      className={cn(
                        "text-xs font-bold px-2 py-1 rounded-lg border shrink-0",
                        isVencido
                          ? "bg-red-100 text-red-700 border-red-200"
                          : item.diasRestantes <= 7
                          ? "bg-orange-100 text-orange-700 border-orange-200"
                          : "bg-amber-100 text-amber-700 border-amber-200"
                      )}
                    >
                      {isVencido ? "VENCIDO" : `${item.diasRestantes}d`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.lot.produtoNome}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.lot.quantidade} un. × R$ {item.lot.custo.toFixed(2).replace(".", ",")} custo
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-red-600">
                        R$ {(item.lot.quantidade * item.lot.custo).toFixed(2).replace(".", ",")}
                      </p>
                      <p className="text-xs text-muted-foreground">em risco</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-3 bg-muted/50 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Valor total em risco (até 7 dias)</span>
              <span className="text-sm font-bold text-red-600">
                R$ {valorTotalEmRisco.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
