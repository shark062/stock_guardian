import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { useStore } from "@/contexts/StoreContext";
import { mockAuditLogs } from "@/services/mockData";
import { gerarPDFSecao } from "@/services/pdfExport";
import {
  ClipboardList,
  Search,
  RefreshCw,
  ShieldAlert,
  ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Package,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AbaAtiva = "sistema" | "reposicoes";

export default function AuditLog() {
  const { reposicoes } = useStore();
  const [search, setSearch] = useState("");
  const [aba, setAba] = useState<AbaAtiva>("sistema");

  const filteredSistema = useMemo(() => {
    if (!search) return mockAuditLogs;
    const q = search.toLowerCase();
    return mockAuditLogs.filter(
      (l) =>
        l.usuario.toLowerCase().includes(q) ||
        l.acao.toLowerCase().includes(q) ||
        l.detalhes.toLowerCase().includes(q)
    );
  }, [search]);

  const filteredReposicoes = useMemo(() => {
    if (!search) return reposicoes;
    const q = search.toLowerCase();
    return reposicoes.filter(
      (r) =>
        r.usuarioNome.toLowerCase().includes(q) ||
        r.produtoNome.toLowerCase().includes(q) ||
        r.produtoCodigo.includes(q)
    );
  }, [reposicoes, search]);

  const acaoColor = (acao: string) => {
    if (acao.includes("vencido") || acao.includes("exclui") || acao.includes("erro"))
      return "bg-red-100 text-red-700";
    if (acao.includes("alterou") || acao.includes("editou"))
      return "bg-amber-100 text-amber-700";
    if (acao.includes("cadastrou") || acao.includes("criou") || acao.includes("registrou"))
      return "bg-emerald-100 text-emerald-700";
    return "bg-blue-100 text-blue-700";
  };

  const handleExportReposicoes = () => {
    const erros = reposicoes.filter((r) => r.erro_fifo);
    const corretos = reposicoes.filter((r) => !r.erro_fifo);

    gerarPDFSecao(
      "Auditoria de Reposições",
      `Stock Guardian — ${reposicoes.length} registro(s) — gerado em ${new Date().toLocaleString("pt-BR")}`,
      [
        {
          label: "Resumo Geral",
          columns: [
            { header: "Indicador", key: "indicador", width: 3 },
            { header: "Valor", key: "valor", width: 1.5, align: "right" },
          ],
          rows: [
            { indicador: "Total de Reposições", valor: String(reposicoes.length) },
            { indicador: "Corretas (FIFO OK)", valor: String(corretos.length) },
            { indicador: "Erros FIFO", valor: String(erros.length) },
            { indicador: "Taxa de Conformidade FIFO", valor: reposicoes.length > 0 ? `${((corretos.length / reposicoes.length) * 100).toFixed(1)}%` : "100%" },
            { indicador: "Com Foto Registrada", valor: String(reposicoes.filter((r) => r.imagemUrl).length) },
          ],
        },
        {
          label: "Erros de FIFO Detectados",
          columns: [
            { header: "Produto", key: "produto", width: 2.5 },
            { header: "Usuário", key: "usuario", width: 1.5 },
            { header: "Qtd.", key: "quantidade", width: 0.7, align: "center" },
            { header: "Validade", key: "validade", width: 1.2, align: "center" },
            { header: "Data/Hora", key: "data", width: 1.8, align: "center" },
          ],
          rows: erros.map((r) => ({
            produto: r.produtoNome,
            usuario: r.usuarioNome,
            quantidade: String(r.quantidade),
            validade: new Date(r.validade + "T00:00:00").toLocaleDateString("pt-BR"),
            data: new Date(r.data).toLocaleString("pt-BR"),
          })),
        },
        {
          label: "Todos os Registros de Reposição",
          columns: [
            { header: "Produto", key: "produto", width: 2.5 },
            { header: "Código", key: "codigo", width: 1.4, align: "center" },
            { header: "Usuário", key: "usuario", width: 1.5 },
            { header: "Qtd.", key: "quantidade", width: 0.7, align: "center" },
            { header: "Validade", key: "validade", width: 1.2, align: "center" },
            { header: "FIFO", key: "fifo", width: 0.7, align: "center" },
            { header: "Foto", key: "foto", width: 0.6, align: "center" },
            { header: "Data/Hora", key: "data", width: 1.8, align: "center" },
          ],
          rows: reposicoes.map((r) => ({
            produto: r.produtoNome,
            codigo: r.produtoCodigo,
            usuario: r.usuarioNome,
            quantidade: String(r.quantidade),
            validade: new Date(r.validade + "T00:00:00").toLocaleDateString("pt-BR"),
            fifo: r.erro_fifo ? "ERRO" : "OK",
            foto: r.imagemUrl ? "SIM" : "NÃO",
            data: new Date(r.data).toLocaleString("pt-BR"),
          })),
        },
      ],
      `auditoria-reposicoes-${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  const totalErrosFifo = reposicoes.filter((r) => r.erro_fifo).length;
  const totalComFoto = reposicoes.filter((r) => r.imagemUrl).length;

  return (
    <Layout title="Log de Auditoria">
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Total Reposições",
              value: reposicoes.length,
              icon: RefreshCw,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Erros FIFO",
              value: totalErrosFifo,
              icon: ShieldAlert,
              color: "text-red-600",
              bg: "bg-red-50",
            },
            {
              label: "Com Foto",
              value: totalComFoto,
              icon: ImageIcon,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "Logs Sistema",
              value: mockAuditLogs.length,
              icon: ClipboardList,
              color: "text-slate-600",
              bg: "bg-slate-50",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-card rounded-xl border border-card-border p-4 shadow-sm animate-fade-in"
            >
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-2`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setAba("sistema")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer",
                aba === "sistema"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Logs do Sistema
            </button>
            <button
              onClick={() => setAba("reposicoes")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                aba === "reposicoes"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Auditoria de Reposições
              {totalErrosFifo > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full font-bold">
                  {totalErrosFifo}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={aba === "sistema" ? "Buscar nos logs..." : "Buscar reposições..."}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm bg-card border border-border text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="input-audit-search"
              />
            </div>
            {aba === "reposicoes" && reposicoes.length > 0 && (
              <button
                onClick={handleExportReposicoes}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar CSV
              </button>
            )}
          </div>
        </div>

        {aba === "sistema" && (
          <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-sm text-foreground">Histórico de Ações do Sistema</span>
              <span className="ml-auto text-xs text-muted-foreground">{filteredSistema.length} registro(s)</span>
            </div>
            <div className="divide-y divide-border">
              {filteredSistema.length === 0 ? (
                <div className="px-5 py-10 text-center text-muted-foreground">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Nenhum log encontrado
                </div>
              ) : (
                filteredSistema.map((log) => (
                  <div
                    key={log.id}
                    className="px-5 py-4 flex items-start gap-4 hover:bg-muted/20 transition-colors animate-fade-in"
                    data-testid={`log-${log.id}`}
                  >
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
        )}

        {aba === "reposicoes" && (
          <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-sm text-foreground">Auditoria de Reposições</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {filteredReposicoes.length} registro(s)
              </span>
            </div>

            {filteredReposicoes.length === 0 ? (
              <div className="px-5 py-12 text-center text-muted-foreground">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma reposição registrada ainda</p>
                <p className="text-xs mt-1">
                  As reposições registradas pelos operadores aparecerão aqui
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border overflow-y-auto" style={{ maxHeight: "540px" }}>
                {filteredReposicoes.map((r) => (
                  <div
                    key={r.id}
                    className={cn(
                      "px-5 py-4 flex items-start gap-4 hover:bg-muted/20 transition-colors",
                      r.erro_fifo && "bg-red-50/40"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold",
                        r.erro_fifo
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      )}
                    >
                      {r.usuarioNome.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-foreground">{r.usuarioNome}</span>
                        <span className="text-xs text-muted-foreground">registrou reposição</span>
                        {r.erro_fifo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                            <AlertTriangle className="w-3 h-3" />
                            Erro FIFO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" />
                            FIFO OK
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-foreground font-medium">{r.produtoNome}</p>
                      <p className="text-xs text-muted-foreground">
                        Código: {r.produtoCodigo} — {r.quantidade} un. — Validade:{" "}
                        {new Date(r.validade + "T00:00:00").toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(r.data).toLocaleString("pt-BR")}
                      </p>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      {r.imagemUrl && (
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          <ImageIcon className="w-3 h-3" />
                          Foto
                        </span>
                      )}
                      {r.imagemUrl && (
                        <a
                          href={r.imagemUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={r.imagemUrl}
                            alt="Foto da validade"
                            className="w-12 h-12 object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
