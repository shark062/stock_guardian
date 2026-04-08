import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "./NotificationBell";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false);

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
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="flex items-center gap-2">
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
          <div className="flex items-center gap-2 ml-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-default shrink-0"
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
