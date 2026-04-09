import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Footer } from "@/components/Footer";
import appIcon from "@assets/1775751717154_1775752093514.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      setErro("Preencha todos os campos.");
      return;
    }
    setErro("");
    setIsLoading(true);
    try {
      await login(email, senha);
      setLocation("/dashboard");
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "hsl(220, 73%, 16%)" }}
    >
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <img src={appIcon} alt="Stock Guardian" className="w-24 h-24 object-contain rounded-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Stock Guardian</h1>
            <p className="mt-1 text-sm" style={{ color: "hsl(40, 54%, 65%)" }}>
              Sistema de Controle de Validade
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-8 shadow-2xl"
            style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 className="text-xl font-semibold text-white mb-1">Bem-vindo de volta</h2>
            <p className="text-sm text-slate-400 mb-6">Faça login para continuar</p>

            {erro && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3 mb-4 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {erro}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="email">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }}
                    placeholder="seu@email.com"
                    data-testid="input-email"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="senha">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="senha"
                    type={showSenha ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }}
                    placeholder="••••••••"
                    data-testid="input-senha"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    data-testid="btn-toggle-senha"
                  >
                    {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 mt-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}
                data-testid="btn-login"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Autenticando...
                  </span>
                ) : (
                  "Entrar no sistema"
                )}
              </button>
            </form>

            {/* Demo users hint */}
            <div className="mt-6 pt-6 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wide">Usuários de demonstração</p>
              <div className="space-y-2">
                {[
                  { email: "admin@stockguardian.com", senha: "admin123", role: "Admin" },
                  { email: "carlos@stockguardian.com", senha: "carlos123", role: "Operador" },
                  { email: "fernanda@stockguardian.com", senha: "fernanda123", role: "Viewer" },
                ].map((u) => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => { setEmail(u.email); setSenha(u.senha); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all cursor-pointer"
                    style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                    data-testid={`btn-demo-${u.role.toLowerCase()}`}
                  >
                    <span className="font-medium text-slate-300">{u.role}</span>
                    <span className="text-slate-500 ml-2">{u.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
