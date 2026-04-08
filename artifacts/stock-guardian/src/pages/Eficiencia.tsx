import { Layout } from "@/components/Layout";
import { useStore } from "@/contexts/StoreContext";
import {
  Trophy,
  Users,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Package,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

function EficienciaBadge({ valor }: { valor: number }) {
  if (valor >= 90) {
    return (
      <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
        Excelente
      </span>
    );
  }
  if (valor >= 70) {
    return (
      <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
        Bom
      </span>
    );
  }
  return (
    <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
      Atenção
    </span>
  );
}

export default function Eficiencia() {
  const { eficienciaUsuarios, reposicoes } = useStore();

  const totalReposicoes = reposicoes.length;
  const totalErrosFifo = reposicoes.filter((r) => r.erro_fifo).length;
  const eficienciaGeral =
    totalReposicoes > 0
      ? ((totalReposicoes - totalErrosFifo) / totalReposicoes) * 100
      : 100;

  const reposicoesRecentes = [...reposicoes].slice(0, 10);

  return (
    <Layout title="Relatório de Eficiência">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-card-border shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalReposicoes}</p>
            <p className="text-sm font-medium text-foreground mt-0.5">Total de Reposições</p>
            <p className="text-xs text-muted-foreground mt-0.5">registradas no sistema</p>
          </div>

          <div className="bg-card rounded-xl border border-card-border shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalErrosFifo}</p>
            <p className="text-sm font-medium text-foreground mt-0.5">Erros FIFO</p>
            <p className="text-xs text-muted-foreground mt-0.5">rodízio não respeitado</p>
          </div>

          <div className="bg-card rounded-xl border border-card-border shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: eficienciaGeral >= 90 ? "hsl(160,60%,94%)" : eficienciaGeral >= 70 ? "hsl(40,80%,94%)" : "hsl(0,72%,94%)" }}
              >
                <BarChart3
                  className="w-5 h-5"
                  style={{ color: eficienciaGeral >= 90 ? "hsl(160,60%,35%)" : eficienciaGeral >= 70 ? "hsl(40,80%,40%)" : "hsl(0,72%,51%)" }}
                />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{eficienciaGeral.toFixed(1)}%</p>
            <p className="text-sm font-medium text-foreground mt-0.5">Eficiência Geral</p>
            <p className="text-xs text-muted-foreground mt-0.5">média de toda a equipe</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Trophy className="w-4 h-4" style={{ color: "hsl(40, 54%, 54%)" }} />
              <h3 className="font-semibold text-foreground text-sm">Ranking de Eficiência</h3>
              <span className="ml-auto text-xs text-muted-foreground">{eficienciaUsuarios.length} usuários</span>
            </div>

            {eficienciaUsuarios.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma reposição registrada</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {eficienciaUsuarios.map((u, idx) => (
                  <div key={u.usuario} className="px-5 py-4 flex items-center gap-4">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                        idx === 0
                          ? "text-white"
                          : idx === 1
                          ? "bg-slate-200 text-slate-600"
                          : idx === 2
                          ? "bg-amber-100 text-amber-700"
                          : "bg-muted text-muted-foreground"
                      )}
                      style={idx === 0 ? { backgroundColor: "hsl(40, 54%, 54%)" } : {}}
                    >
                      {idx === 0 ? <Trophy className="w-4 h-4" /> : idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{u.usuarioNome}</p>
                      <p className="text-xs text-muted-foreground">{u.usuario}</p>
                      <div className="mt-1.5 w-full bg-muted rounded-full h-1.5">
                        <div
                          className={cn(
                            "h-1.5 rounded-full transition-all duration-700",
                            u.eficiencia >= 90
                              ? "bg-emerald-500"
                              : u.eficiencia >= 70
                              ? "bg-amber-500"
                              : "bg-red-500"
                          )}
                          style={{ width: `${u.eficiencia}%` }}
                        />
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-lg font-bold text-foreground">{u.eficiencia.toFixed(1)}%</p>
                      <div className="flex items-center gap-1.5 justify-end mt-0.5">
                        <span className="text-xs text-muted-foreground">{u.total} reposições</span>
                        {u.erros > 0 && (
                          <span className="text-xs text-red-500 flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            {u.erros} erro(s)
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <EficienciaBadge valor={u.eficiencia} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">Últimas Reposições</h3>
            </div>
            {reposicoesRecentes.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma reposição ainda</p>
              </div>
            ) : (
              <div className="divide-y divide-border overflow-y-auto" style={{ maxHeight: "360px" }}>
                {reposicoesRecentes.map((r) => (
                  <div key={r.id} className="px-5 py-3 flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${r.erro_fifo ? "bg-red-500" : "bg-emerald-500"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.produtoNome}</p>
                      <p className="text-xs text-muted-foreground">
                        por {r.usuarioNome} — {r.quantidade} un.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.data).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {r.erro_fifo ? (
                        <span className="text-xs bg-red-100 text-red-600 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          FIFO
                        </span>
                      ) : (
                        <span className="text-xs bg-emerald-100 text-emerald-600 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          OK
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
