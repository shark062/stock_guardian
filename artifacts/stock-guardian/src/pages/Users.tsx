import { useState } from "react";
import { Layout } from "@/components/Layout";
import { mockUsers, User } from "@/services/mockData";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users as UsersIcon,
  Plus,
  Edit2,
  X,
  Save,
  Loader2,
  Shield,
  Eye,
  Wrench,
  Check,
  Ban,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const permissoesPorRole: Record<User["role"], { label: string; ok: boolean }[]> = {
  admin: [
    { label: "Ver dashboard e relatórios", ok: true },
    { label: "Registrar reposição de produtos", ok: true },
    { label: "Visualizar promoções sugeridas", ok: true },
    { label: "Ver eficiência de operadores", ok: true },
    { label: "Gerenciar usuários", ok: true },
    { label: "Ver log de auditoria", ok: true },
    { label: "Configurar servidor externo", ok: true },
    { label: "Exportar relatórios financeiros", ok: true },
  ],
  operador: [
    { label: "Ver dashboard e relatórios", ok: true },
    { label: "Registrar reposição de produtos", ok: true },
    { label: "Visualizar promoções sugeridas", ok: true },
    { label: "Ver eficiência de operadores", ok: false },
    { label: "Gerenciar usuários", ok: false },
    { label: "Ver log de auditoria", ok: false },
    { label: "Configurar servidor externo", ok: false },
    { label: "Exportar relatórios financeiros", ok: false },
  ],
  viewer: [
    { label: "Ver dashboard e relatórios", ok: true },
    { label: "Registrar reposição de produtos", ok: false },
    { label: "Visualizar promoções sugeridas", ok: true },
    { label: "Ver eficiência de operadores", ok: false },
    { label: "Gerenciar usuários", ok: false },
    { label: "Ver log de auditoria", ok: false },
    { label: "Configurar servidor externo", ok: false },
    { label: "Exportar relatórios financeiros", ok: false },
  ],
};

const roleConfig = {
  admin: {
    label: "Administrador",
    icon: Shield,
    badge: "bg-blue-100 text-blue-800 border border-blue-200",
    iconColor: "text-blue-600",
    desc: "Acesso total ao sistema: gerencia usuários, relatórios financeiros e auditorias.",
  },
  operador: {
    label: "Operador",
    icon: Wrench,
    badge: "bg-amber-100 text-amber-800 border border-amber-200",
    iconColor: "text-amber-600",
    desc: "Cadastra reposições e visualiza dados. Não gerencia usuários nem acessa auditoria.",
  },
  viewer: {
    label: "Visualizador",
    icon: Eye,
    badge: "bg-gray-100 text-gray-700 border border-gray-200",
    iconColor: "text-gray-500",
    desc: "Somente leitura. Pode ver dashboard e promoções, mas não faz alterações.",
  },
};

interface EditState {
  nome: string;
  role: User["role"];
  ativo: boolean;
}

const STORAGE_KEY = "sg_users_state";

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as User[];
  } catch {}
  return [...mockUsers];
}

function saveUsers(users: User[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch {}
}

export default function UsersPage() {
  const { isAdmin, user: loggedUser } = useAuth();
  const [users, setUsers] = useState<User[]>(loadUsers);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [edit, setEdit] = useState<EditState>({ nome: "", role: "viewer", ativo: true });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPermModal, setShowPermModal] = useState<User["role"] | null>(null);
  const [newUser, setNewUser] = useState({ nome: "", email: "", role: "viewer" as User["role"] });
  const [saving, setSaving] = useState(false);

  const persist = (updated: User[]) => {
    setUsers(updated);
    saveUsers(updated);
  };

  const handleEdit = (u: User) => {
    setEditingId(u.id);
    setEdit({ nome: u.nome, role: u.role, ativo: u.ativo });
  };

  const handleSave = async (u: User) => {
    if (!edit.nome.trim()) {
      toast.error("Nome não pode ficar em branco.");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 350));
    const updated = users.map((item) =>
      item.id === u.id
        ? { ...item, nome: edit.nome.trim(), role: edit.role, ativo: edit.ativo }
        : item
    );
    persist(updated);
    setSaving(false);
    setEditingId(null);
    toast.success(`Usuário "${edit.nome.trim()}" atualizado.`);
  };

  const handleAdd = async () => {
    if (!newUser.nome.trim() || !newUser.email.trim()) {
      toast.error("Nome e e-mail são obrigatórios.");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 350));
    const user: User = {
      id: Date.now(),
      nome: newUser.nome.trim(),
      email: newUser.email.trim(),
      role: newUser.role,
      ativo: true,
      criadoEm: new Date().toISOString().split("T")[0],
    };
    const updated = [user, ...users];
    persist(updated);
    setSaving(false);
    setShowAddModal(false);
    setNewUser({ nome: "", email: "", role: "viewer" });
    toast.success(`Usuário "${user.nome}" criado com sucesso.`);
  };

  const ativos = users.filter((u) => u.ativo).length;

  return (
    <Layout title="Usuários">
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {users.length} usuário(s) — {ativos} ativo(s)
            </span>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}
            >
              <Plus className="w-4 h-4" />
              Novo Usuário
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.entries(roleConfig) as [User["role"], typeof roleConfig[keyof typeof roleConfig]][]).map(([role, cfg]) => (
            <div key={role} className="bg-card rounded-xl border border-card-border p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <cfg.icon className={`w-4 h-4 ${cfg.iconColor}`} />
                  <span className="text-sm font-semibold text-foreground">{cfg.label}</span>
                </div>
                <button
                  onClick={() => setShowPermModal(role)}
                  className="p-1 rounded hover:bg-muted transition-colors cursor-pointer"
                  title="Ver permissões detalhadas"
                >
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{cfg.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {users.filter((u) => u.role === role && u.ativo).length} ativo(s)
                </span>
                <button
                  onClick={() => setShowPermModal(role)}
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  Ver permissões
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm text-foreground">Lista de Usuários</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Usuário</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">E-mail</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Permissão</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Criado em</th>
                  {isAdmin && <th className="px-4 py-3 w-24" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => {
                  const isEditing = editingId === u.id;
                  const cfg = roleConfig[isEditing ? edit.role : u.role];
                  const isMe = loggedUser?.email === u.email;

                  return (
                    <tr
                      key={u.id}
                      className={cn("hover:bg-muted/30 transition-colors", isMe && "bg-primary/5")}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}
                          >
                            {(isEditing ? edit.nome : u.nome).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            {isEditing ? (
                              <input
                                type="text"
                                value={edit.nome}
                                onChange={(e) => setEdit((p) => ({ ...p, nome: e.target.value }))}
                                placeholder="Nome completo"
                                autoFocus
                                className="px-2 py-1 rounded text-sm bg-muted border border-primary/40 text-foreground outline-none focus:ring-2 focus:ring-primary/30 w-36"
                              />
                            ) : (
                              <span className="font-medium text-foreground">
                                {u.nome}
                                {isMe && (
                                  <span className="ml-1.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">
                                    Você
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">{u.email}</td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={edit.role}
                            onChange={(e) => setEdit((p) => ({ ...p, role: e.target.value as User["role"] }))}
                            className="px-2 py-1 rounded text-xs bg-muted border border-border text-foreground outline-none"
                          >
                            <option value="admin">Administrador</option>
                            <option value="operador">Operador</option>
                            <option value="viewer">Visualizador</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleConfig[u.role].badge}`}>
                            <cfg.icon className="w-3 h-3" />
                            {roleConfig[u.role].label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={edit.ativo ? "ativo" : "inativo"}
                            onChange={(e) => setEdit((p) => ({ ...p, ativo: e.target.value === "ativo" }))}
                            className="px-2 py-1 rounded text-xs bg-muted border border-border text-foreground outline-none"
                          >
                            <option value="ativo">Ativo</option>
                            <option value="inativo">Inativo</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${u.ativo ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.ativo ? "bg-emerald-500" : "bg-gray-400"}`} />
                            {u.ativo ? "Ativo" : "Inativo"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                        {new Date(u.criadoEm + "T00:00:00").toLocaleDateString("pt-BR")}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleSave(u)}
                                disabled={saving}
                                className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
                                title="Salvar"
                              >
                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEdit(u)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                              title="Editar usuário"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showPermModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(() => {
                  const R = roleConfig[showPermModal];
                  return (
                    <>
                      <R.icon className={`w-4 h-4 ${R.iconColor}`} />
                      <h3 className="font-semibold text-foreground">
                        Permissões — {R.label}
                      </h3>
                    </>
                  );
                })()}
              </div>
              <button onClick={() => setShowPermModal(null)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-2">
              {permissoesPorRole[showPermModal].map((p, i) => (
                <div key={i} className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                  p.ok ? "bg-emerald-50" : "bg-muted/60"
                )}>
                  {p.ok ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Ban className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={cn("text-sm", p.ok ? "text-emerald-800 font-medium" : "text-muted-foreground line-through")}>
                    {p.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5">
              <button
                onClick={() => setShowPermModal(null)}
                className="w-full py-2 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 transition-colors cursor-pointer text-foreground"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Novo Usuário</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nome completo *</label>
                <input
                  type="text"
                  value={newUser.nome}
                  onChange={(e) => setNewUser((p) => ({ ...p, nome: e.target.value }))}
                  placeholder="Ex: Maria Silva"
                  className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">E-mail *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Ex: maria@empresa.com"
                  className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Permissão</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value as User["role"] }))}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="admin">Administrador — acesso total</option>
                  <option value="operador">Operador — cadastra reposições</option>
                  <option value="viewer">Visualizador — somente leitura</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {roleConfig[newUser.role].desc}
                </p>
              </div>
            </div>
            <div className="px-6 pb-5 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !newUser.nome || !newUser.email}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}
              >
                {saving ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Criando...</span>
                ) : (
                  "Criar Usuário"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
