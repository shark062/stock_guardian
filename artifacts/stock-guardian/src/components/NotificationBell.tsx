import { useState, useRef, useEffect } from "react";
import { Bell, X, CheckCheck } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { Notification } from "@/services/mockData";
import { cn } from "@/lib/utils";

const iconeTipo: Record<string, string> = {
  lote: "📦",
  validade: "⏰",
  fifo: "🔄",
  promocao: "💰",
  sistema: "🔔",
};

const corTipo: Record<string, string> = {
  lote: "bg-blue-50 border-blue-200",
  validade: "bg-amber-50 border-amber-200",
  fifo: "bg-red-50 border-red-200",
  promocao: "bg-emerald-50 border-emerald-200",
  sistema: "bg-slate-50 border-slate-200",
};

export function NotificationBell() {
  const { user, isAdmin } = useAuth();
  const { getNotificationsForUser, getUnreadCount, markAllRead, markOneRead } =
    useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const userEmail = user?.email ?? "";
  const unread = getUnreadCount(userEmail, isAdmin);
  const notificacoes = getNotificationsForUser(userEmail, isAdmin);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function formatDate(iso: string) {
    const d = new Date(iso);
    const agora = new Date();
    const diff = agora.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "agora mesmo";
    if (mins < 60) return `${mins}min atrás`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h atrás`;
    const dias = Math.floor(hrs / 24);
    return `${dias}d atrás`;
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center text-white px-1"
            style={{ backgroundColor: "hsl(0, 72%, 51%)" }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-10 w-[340px] bg-card border border-card-border rounded-xl shadow-xl z-50 overflow-hidden"
          style={{ maxHeight: "480px" }}
        >
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Notificações
              </span>
              {unread > 0 && (
                <span className="text-xs bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={() => markAllRead(userEmail, isAdmin)}
                  className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer px-2 py-1 rounded hover:bg-muted"
                >
                  <CheckCheck className="w-3 h-3" />
                  Marcar todas
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-muted cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: "380px" }}>
            {notificacoes.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
              </div>
            ) : (
              notificacoes.map((n: Notification) => (
                <div
                  key={n.id}
                  className={cn(
                    "px-4 py-3 border-b border-border/50 cursor-pointer hover:bg-muted/40 transition-colors",
                    !n.lida && "bg-blue-50/40"
                  )}
                  onClick={() => markOneRead(n.id)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-base shrink-0 mt-0.5">
                      {iconeTipo[n.tipo] ?? "🔔"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-xs leading-relaxed",
                          n.lida ? "text-muted-foreground" : "text-foreground font-medium"
                        )}
                      >
                        {n.mensagem}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(n.data)}
                        </span>
                        {n.destinatario === "admin" && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                            Admin
                          </span>
                        )}
                        {!n.lida && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
