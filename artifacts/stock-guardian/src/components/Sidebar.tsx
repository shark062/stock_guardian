import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  LogOut,
  Shield,
  ClipboardList,
  ChevronRight,
  RefreshCw,
  Tag,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  operadorPlus?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/reposicao", label: "Reposição", icon: RefreshCw, operadorPlus: true },
  { href: "/promocoes", label: "Promoções", icon: Tag },
  { href: "/eficiencia", label: "Eficiência", icon: BarChart3, adminOnly: true },
  { href: "/relatorios", label: "Relatórios", icon: FileText },
  { href: "/usuarios", label: "Usuários", icon: Users, adminOnly: true },
  { href: "/auditoria", label: "Auditoria", icon: ClipboardList, adminOnly: true },
];

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  operador: "Operador",
  viewer: "Visualizador",
};

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout, isAdmin, isOperador } = useAuth();

  const visibleItems = navItems.filter((item) => {
    if (item.adminOnly) return isAdmin;
    if (item.operadorPlus) return isAdmin || isOperador;
    return true;
  });

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col z-40 animate-slide-in-left"
      style={{ backgroundColor: "hsl(220, 73%, 16%)" }}
      data-testid="sidebar"
    >
      <div className="px-6 py-5 border-b" style={{ borderColor: "hsl(220, 60%, 22%)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center animate-pulse-ring"
            style={{ backgroundColor: "hsl(40, 54%, 54%)" }}
          >
            <Shield className="w-5 h-5" style={{ color: "hsl(220, 73%, 16%)" }} />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-wide">Stock Guardian</h1>
            <p className="text-xs" style={{ color: "hsl(40, 54%, 64%)" }}>
              Controle de Validade
            </p>
          </div>
        </div>
      </div>

      {user && (
        <div className="px-4 py-3 border-b mx-2 mt-2 rounded-xl" style={{ backgroundColor: "hsl(220, 60%, 20%)", borderColor: "hsl(220, 60%, 24%)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 16%)" }}
            >
              {user.nome.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold truncate">{user.nome}</p>
              <p className="text-xs truncate" style={{ color: "hsl(40, 54%, 65%)" }}>
                {roleLabels[user.role]}
              </p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(220, 30%, 55%)" }}>
          Menu
        </p>
        {visibleItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                  isActive
                    ? "text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
                style={
                  isActive
                    ? { backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }
                    : {}
                }
                data-testid={`nav-${item.href.replace("/", "")}`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 border-t pt-3" style={{ borderColor: "hsl(220, 60%, 22%)" }}>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 transition-all duration-200 cursor-pointer"
          data-testid="btn-logout"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sair do sistema</span>
        </button>
        <div className="mt-3 text-center">
          <p className="text-xs" style={{ color: "hsl(220, 30%, 40%)" }}>
            powered by{" "}
            <span style={{ color: "hsl(40, 54%, 54%)" }} className="font-semibold">
              Shark_Tech
            </span>
          </p>
        </div>
      </div>
    </aside>
  );
}
