import { useState } from "react";
import {
  Server,
  Wifi,
  WifiOff,
  Save,
  TestTube2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Info,
} from "lucide-react";
import { getServerConfig, saveServerConfig, testarConexao, ServerConfig } from "@/services/integracao";
import { cn } from "@/lib/utils";

interface ServerConfigProps {
  onSaved?: () => void;
}

export function ServerConfigPanel({ onSaved }: ServerConfigProps) {
  const [cfg, setCfg] = useState<ServerConfig>(getServerConfig);
  const [showSenha, setShowSenha] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; mensagem: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 200));
    saveServerConfig(cfg);
    setSaving(false);
    setTestResult(null);
    onSaved?.();
  };

  const handleTest = async () => {
    if (!cfg.ip || !cfg.porta) {
      setTestResult({ ok: false, mensagem: "Preencha o IP e a porta antes de testar." });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const tmpCfg = { ...cfg, ativo: true };
    saveServerConfig(tmpCfg);

    const result = await testarConexao();
    setTestResult(result);
    setTesting(false);

    saveServerConfig(cfg);
  };

  return (
    <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <Server className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm text-foreground">Configuração do Servidor Externo</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className={cn(
            "w-2 h-2 rounded-full",
            cfg.ativo ? "bg-emerald-500" : "bg-gray-400"
          )} />
          <span className="text-xs text-muted-foreground">
            {cfg.ativo ? "Integração ativa" : "Usando dados simulados"}
          </span>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Configure o servidor JM Scan ou qualquer servidor REST que retorne produtos em JSON.
            O sistema tentará vários endpoints automaticamente.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Endereço IP do servidor
            </label>
            <input
              type="text"
              value={cfg.ip}
              onChange={(e) => setCfg((p) => ({ ...p, ip: e.target.value.trim() }))}
              placeholder="Ex: 192.168.2.198"
              className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Porta
            </label>
            <input
              type="text"
              value={cfg.porta}
              onChange={(e) => setCfg((p) => ({ ...p, porta: e.target.value.trim() }))}
              placeholder="Ex: 8559"
              className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Senha de acesso
          </label>
          <div className="relative">
            <input
              type={showSenha ? "text" : "password"}
              value={cfg.senha}
              onChange={(e) => setCfg((p) => ({ ...p, senha: e.target.value }))}
              placeholder="Senha ou token de acesso"
              className="w-full pl-3 pr-10 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowSenha(!showSenha)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCfg((p) => ({ ...p, ativo: !p.ativo }))}
            className={cn(
              "relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0",
              cfg.ativo ? "bg-emerald-500" : "bg-muted-foreground/30"
            )}
          >
            <div className={cn(
              "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
              cfg.ativo ? "translate-x-5" : "translate-x-0.5"
            )} />
          </button>
          <div>
            <p className="text-sm font-medium text-foreground">
              {cfg.ativo ? "Integração com servidor ativa" : "Usando dados simulados"}
            </p>
            <p className="text-xs text-muted-foreground">
              {cfg.ativo
                ? "O sistema tentará buscar dados reais do servidor na próxima sincronização"
                : "Ative para conectar ao servidor real"}
            </p>
          </div>
        </div>

        {testResult && (
          <div className={cn(
            "flex items-start gap-3 px-4 py-3 rounded-xl border",
            testResult.ok
              ? "bg-emerald-50 border-emerald-200"
              : "bg-red-50 border-red-200"
          )}>
            {testResult.ok
              ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
            <p className={cn("text-xs leading-relaxed", testResult.ok ? "text-emerald-700" : "text-red-600")}>
              {testResult.mensagem}
            </p>
          </div>
        )}

        {!testResult && cfg.ativo && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Certifique-se de que o dispositivo está na mesma rede Wi-Fi que o servidor e que o servidor JM Scan está em execução.
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleTest}
            disabled={testing || !cfg.ip || !cfg.porta}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 transition-colors cursor-pointer disabled:opacity-50 text-foreground"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube2 className="w-4 h-4" />}
            {testing ? "Testando..." : "Testar conexão"}
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 ml-auto"
            style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Salvando..." : "Salvar configuração"}
          </button>
        </div>

        <div className="bg-muted/60 rounded-lg px-4 py-3">
          <p className="text-xs font-semibold text-foreground mb-1.5">Endpoints testados automaticamente:</p>
          <div className="space-y-0.5">
            {[
              "/api/produtos", "/produtos", "/api/products",
              "/products", "/api/estoque", "/estoque",
            ].map((ep) => (
              <p key={ep} className="text-[11px] text-muted-foreground font-mono">
                {cfg.ip && cfg.porta ? `http://${cfg.ip}:${cfg.porta}` : "http://servidor:porta"}{ep}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
