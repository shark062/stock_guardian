import { useState, useEffect, useRef } from "react";
import { Moon, Sun, Menu, KeyRound, LogOut, Eye, EyeOff, X, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "./NotificationBell";
import { checkCurrentPassword, setUserPassword } from "@/services/api";
import { toast } from "sonner";

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showAtual, setShowAtual] = useState(false);
  const [showNova, setShowNova] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("sg_theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

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

  const openModal = () => {
    setDropdownOpen(false);
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
    setShowAtual(false);
    setShowNova(false);
    setShowConfirmar(false);
    setShowModal(true);
  };

  const handleSalvarSenha = () => {
    if (!user) return;
    if (!senhaAtual.trim()) {
      toast.error("Informe a senha atual.");
      return;
    }
    if (!checkCurrentPassword(user.email, senhaAtual)) {
      toast.error("Senha atual incorreta.");
      return;
    }
    if (novaSenha.length < 4) {
      toast.error("A nova senha deve ter no mínimo 4 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setUserPassword(user.email, novaSenha, false);
      setSaving(false);
      setShowModal(false);
      toast.success("Senha alterada com sucesso!");
    }, 400);
  };

  return (
    <>
      <header className="h-16 bg-card border-b border-border flex items-center px-4 sm:px-6 gap-3" data-testid="header">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors cursor-pointer shrink-0"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground text-base sm:text-lg truncate">{title}</h2>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
            data-testid="btn-theme-toggle"
            title={isDark ? "Modo claro" : "Modo escuro"}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Moon className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          <NotificationBell />

          {user && (
            <div className="relative ml-1" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted transition-colors cursor-pointer"
                data-testid="user-menu-btn"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}
                  data-testid="user-avatar"
                >
                  {user.nome.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-foreground leading-none">{user.nome}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">{user.role}</p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground hidden sm:block transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                  <button
                    onClick={openModal}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-muted-foreground" />
                    Trocar Senha
                  </button>
                  <div className="border-t border-border my-1" />
                  <button
                    onClick={() => { setDropdownOpen(false); logout(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl border border-card-border shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Trocar Senha</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors cursor-pointer text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Senha atual</label>
                <div className="relative">
                  <input
                    type={showAtual ? "text" : "password"}
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    className="w-full px-3 py-2.5 pr-10 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="Senha atual"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAtual((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showAtual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nova senha</label>
                <div className="relative">
                  <input
                    type={showNova ? "text" : "password"}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full px-3 py-2.5 pr-10 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="Mínimo 4 caracteres"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNova((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showNova ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Confirmar nova senha</label>
                <div className="relative">
                  <input
                    type={showConfirmar ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSalvarSenha()}
                    className="w-full px-3 py-2.5 pr-10 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="Repita a nova senha"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmar((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showConfirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarSenha}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60"
              >
                {saving ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
