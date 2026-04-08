import { Bell, Search, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { mockProducts, getProductStatus } from "@/services/mockData";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  const alertProducts = mockProducts.filter((p) => {
    const s = getProductStatus(p.validade);
    return s === "vencido" || s === "critico";
  });

  useEffect(() => {
    const saved = localStorage.getItem("sg_theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("sg_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("sg_theme", "light");
    }
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center px-6 gap-4" data-testid="header">
      <div className="flex-1">
        <h2 className="font-semibold text-foreground text-lg">{title}</h2>
        <p className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
          data-testid="btn-theme-toggle"
          title={isDark ? "Modo claro" : "Modo escuro"}
        >
          {isDark ? <Sun className="w-4 h-4 text-muted-foreground" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
        </button>

        {/* Alerts bell */}
        <div className="relative">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors relative"
            data-testid="btn-alerts"
          >
            <Bell className="w-4 h-4 text-muted-foreground" />
            {alertProducts.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {alertProducts.length}
              </span>
            )}
          </button>

          {showAlerts && (
            <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
              <div className="px-4 py-3 border-b border-border">
                <p className="font-semibold text-sm text-foreground">Alertas de Validade</p>
                <p className="text-xs text-muted-foreground">{alertProducts.length} produto(s) requerem atenção</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {alertProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-4 py-6 text-center">Nenhum alerta no momento</p>
                ) : (
                  alertProducts.map((p) => {
                    const status = getProductStatus(p.validade);
                    return (
                      <div key={p.id} className="px-4 py-3 border-b border-border last:border-0 flex items-start gap-3">
                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${status === "vencido" ? "bg-red-500" : "bg-orange-500"}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{p.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            Validade: {new Date(p.validade + "T00:00:00").toLocaleDateString("pt-BR")}
                            {status === "vencido" ? " — VENCIDO" : " — Crítico"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        {user && (
          <div className="flex items-center gap-2 ml-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-default"
              style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}
              data-testid="user-avatar"
            >
              {user.nome.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-foreground">{user.nome}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
