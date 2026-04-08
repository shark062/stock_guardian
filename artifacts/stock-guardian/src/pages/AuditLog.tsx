import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { mockAuditLogs } from "@/services/mockData";
import { ClipboardList, Search } from "lucide-react";

export default function AuditLog() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return mockAuditLogs;
    const q = search.toLowerCase();
    return mockAuditLogs.filter(
      (l) =>
        l.usuario.toLowerCase().includes(q) ||
        l.acao.toLowerCase().includes(q) ||
        l.detalhes.toLowerCase().includes(q)
    );
  }, [search]);

  const acaoColor = (acao: string) => {
    if (acao.includes("vencido") || acao.includes("exclui")) return "bg-red-100 text-red-700";
    if (acao.includes("alterou")) return "bg-amber-100 text-amber-700";
    if (acao.includes("cadastrou")) return "bg-emerald-100 text-emerald-700";
    return "bg-blue-100 text-blue-700";
  };

  return (
    <Layout title="Log de Auditoria">
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nos logs..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm bg-card border border-border text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="input-audit-search"
            />
          </div>
          <span className="text-sm text-muted-foreground">{filtered.length} registro(s)</span>
        </div>

        <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-sm text-foreground">Histórico de Ações</span>
          </div>
          <div className="divide-y divide-border">
            {filtered.length === 0 ? (
              <div className="px-5 py-10 text-center text-muted-foreground">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Nenhum log encontrado
              </div>
            ) : (
              filtered.map((log) => (
                <div key={log.id} className="px-5 py-4 flex items-start gap-4 hover:bg-muted/20 transition-colors animate-fade-in" data-testid={`log-${log.id}`}>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-muted-foreground">
                      {log.usuario.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{log.usuario}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${acaoColor(log.acao)}`}>
                        {log.acao}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{log.detalhes}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(log.data).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
