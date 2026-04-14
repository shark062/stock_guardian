import { useState } from "react";
import { Layout } from "@/components/Layout";
import { mockUsers, User } from "@/services/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { createTempPassword, deleteUserPassword, getUserHasPassword } from "@/services/api";
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
  Trash2,
  KeyRound,
  Copy,
  CheckCheck,
  ShieldOff,
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

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#";
  let pass = "";
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
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

interface AddForm {
  nome: string;
  email: string;
  username: string;
  telefone: string;
  role: User["role"];
}

interface EditForm {
  nome: string;
  email: string;
  username: string;
  telefone: string;
  role: User["role"];
  ativo: boolean;
}

export default function UsersPage() {
  const { isAdmin, user: loggedUser } = useAuth();
  const [users, setUsers] = useState<User[]>(loadUsers);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editModal, setEditModal] = useState<User | null>(null);
  const [deleteModal, setDeleteModal] = useState<User | null>(null);
  const [tempPassModal, setTempPassModal] = useState<{ user: User; password: string } | null>(null);
  const [showPermModal, setShowPermModal] = useState<User["role"] | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [addForm, setAddForm] = useState<AddForm>({ nome: "", email: "", username: "", telefone: "", role: "viewer" });
  const [editForm, setEditForm] = useState<EditForm>({ nome: "", email: "", username: "", telefone: "", role: "viewer", ativo: true });

  const persist = (updated: User[]) => {
    setUsers(updated);
    saveUsers(updated);
  };

  const handleAdd = async () => {
    if (!addForm.nome.trim() || !addForm.email.trim() || !addForm.username.trim()) {
      toast.error("Nome, e-mail e usuário são obrigatórios.");
      return;
    }
    if (users.find((u) => u.email.toLowerCase() === addForm.email.trim().toLowerCase())) {
      toast.error("Já existe um usuário com esse e-mail.");
      return;
    }
    if (users.find((u) => u.username?.toLowerCase() === addForm.username.trim().toLowerCase())) {
      toast.error("Esse nome de usuário já está em uso.");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 350));

    const tempPass = generatePassword();
    const newUser: User = {
      id: Date.now(),
      nome: addForm.nome.trim(),
      email: addForm.email.trim(),
      username: addForm.username.trim(),
      telefone: addForm.telefone.trim() || undefined,
      role: addForm.role,
      ativo: true,
      criadoEm: new Date().toISOString().split("T")[0],
    };

    createTempPassword(newUser.email, tempPass);
    persist([newUser, ...users]);
    setSaving(false);
    setShowAddModal(false);
    setAddForm({ nome: "", email: "", username: "", telefone: "", role: "viewer" });
    setTempPassModal({ user: newUser, password: tempPass });
    toast.success(`Usuário "${newUser.nome}" criado!`);
  };

  const openEdit = (u: User) => {
    setEditForm({ nome: u.nome, email: u.email, username: u.username || "", telefone: u.telefone || "", role: u.role, ativo: u.ativo });
    setEditModal(u);
  };

  const handleSave = async () => {
    if (!editForm.nome.trim() || !editForm.email.trim() || !editForm.username.trim()) {
      toast.error("Nome, e-mail e usuário são obrigatórios.");
      return;
    }
    if (users.find((u) => u.email.toLowerCase() === editForm.email.trim().toLowerCase() && u.id !== editModal!.id)) {
      toast.error("Já existe outro usuário com esse e-mail.");
      return;
    }
    if (users.find((u) => u.username?.toLowerCase() === editForm.username.trim().toLowerCase() && u.id !== editModal!.id)) {
      toast.error("Esse nome de usuário já está em uso.");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 350));

    const oldEmail = editModal!.email;
    const newEmail = editForm.email.trim();

    if (oldEmail !== newEmail) {
      const store = JSON.parse(localStorage.getItem("sg_auth_store") || "{}");
      if (store[oldEmail] !== undefined) {
        store[newEmail] = store[oldEmail];
        delete store[oldEmail];
        localStorage.setItem("sg_auth_store", JSON.stringify(store));
      }
    }

    const updated = users.map((u) =>
      u.id === editModal!.id
        ? { ...u, nome: editForm.nome.trim(), email: newEmail, username: editForm.username.trim(), telefone: editForm.telefone.trim() || undefined, role: editForm.role, ativo: editForm.ativo }
        : u
    );
    persist(updated);
    setSaving(false);
    setEditModal(null);
    toast.success(`Usuário "${editForm.nome.trim()}" atualizado.`);
  };

  const handleDelete = async (u: User) => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    deleteUserPassword(u.email);
    persist(users.filter((x) => x.id !== u.id));
    setSaving(false);
    setDeleteModal(null);
    toast.success(`Usuário "${u.nome}" excluído.`);
  };

  const handleCreateTempPass = (u: User) => {
    const tempPass = generatePassword();
    createTempPassword(u.email, tempPass);
    setTempPassModal({ user: u, password: tempPass });
    toast.success("Senha temporária criada.");
  };

  const handleDeletePass = (u: User) => {
    deleteUserPassword(u.email);
    toast.success(`Senha de "${u.nome}" removida. O usuário não conseguirá fazer login.`);
  };

  const handleCopy = async () => {
    if (!tempPassModal) return;
    try {
      await navigator.clipboard.writeText(tempPassModal.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Anote manualmente.");
    }
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Contato</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Permissão</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  {isAdmin && <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => {
                  const cfg = roleConfig[u.role];
                  const isMe = loggedUser?.email === u.email;
                  const hasPass = getUserHasPassword(u.email);

                  return (
                    <tr key={u.id} className={cn("hover:bg-muted/30 transition-colors", isMe && "bg-primary/5")}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}
                          >
                            {u.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-foreground flex items-center gap-1.5">
                              {u.nome}
                              {isMe && (
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">Você</span>
                              )}
                              {!hasPass && (
                                <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">Sem senha</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">@{u.username || u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                        {u.telefone && <div className="text-xs text-muted-foreground">{u.telefone}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>
                          <cfg.icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${u.ativo ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.ativo ? "bg-emerald-500" : "bg-gray-400"}`} />
                          {u.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleCreateTempPass(u)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:bg-amber-100 hover:text-amber-700 transition-colors cursor-pointer"
                              title="Criar senha temporária"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                            {hasPass && (
                              <button
                                onClick={() => handleDeletePass(u)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer"
                                title="Apagar senha"
                              >
                                <ShieldOff className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => openEdit(u)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                              title="Editar usuário"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {!isMe && (
                              <button
                                onClick={() => setDeleteModal(u)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer"
                                title="Excluir usuário"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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
                      <h3 className="font-semibold text-foreground">Permissões — {R.label}</h3>
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
                <div key={i} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg", p.ok ? "bg-emerald-50" : "bg-muted/60")}>
                  {p.ok ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <Ban className="w-4 h-4 text-muted-foreground shrink-0" />}
                  <span className={cn("text-sm", p.ok ? "text-emerald-800 font-medium" : "text-muted-foreground line-through")}>{p.label}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5">
              <button onClick={() => setShowPermModal(null)} className="w-full py-2 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 transition-colors cursor-pointer text-foreground">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
              <h3 className="font-semibold text-foreground">Novo Usuário</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nome completo *</label>
                <input type="text" value={addForm.nome} onChange={(e) => setAddForm((p) => ({ ...p, nome: e.target.value }))} placeholder="Ex: Maria Silva" autoFocus className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nome de usuário (login) *</label>
                <input type="text" value={addForm.username} onChange={(e) => setAddForm((p) => ({ ...p, username: e.target.value.replace(/\s/g, "_") }))} placeholder="Ex: maria_silva" className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30 font-mono" />
                <p className="text-xs text-muted-foreground mt-1">Usado para fazer login no sistema</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">E-mail *</label>
                <input type="email" value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))} placeholder="Ex: maria@empresa.com" className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Telefone</label>
                <input type="tel" value={addForm.telefone} onChange={(e) => setAddForm((p) => ({ ...p, telefone: e.target.value }))} placeholder="Ex: (11) 99999-9999" className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Permissão</label>
                <select value={addForm.role} onChange={(e) => setAddForm((p) => ({ ...p, role: e.target.value as User["role"] }))} className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="admin">Administrador — acesso total</option>
                  <option value="operador">Operador — cadastra reposições</option>
                  <option value="viewer">Visualizador — somente leitura</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1.5">{roleConfig[addForm.role].desc}</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <p className="text-xs text-amber-800">
                  <strong>Senha temporária:</strong> Uma senha temporária será gerada automaticamente. Você poderá copiar e compartilhar com o usuário após a criação.
                </p>
              </div>
            </div>
            <div className="px-6 pb-5 flex justify-end gap-3 sticky bottom-0 bg-card border-t border-border pt-4">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button onClick={handleAdd} disabled={saving || !addForm.nome || !addForm.email || !addForm.username} className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50" style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}>
                {saving ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Criando...</span> : "Criar Usuário"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
              <h3 className="font-semibold text-foreground">Editar Usuário</h3>
              <button onClick={() => setEditModal(null)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nome completo *</label>
                <input type="text" value={editForm.nome} onChange={(e) => setEditForm((p) => ({ ...p, nome: e.target.value }))} autoFocus className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nome de usuário (login) *</label>
                <input type="text" value={editForm.username} onChange={(e) => setEditForm((p) => ({ ...p, username: e.target.value.replace(/\s/g, "_") }))} className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30 font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">E-mail *</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Telefone</label>
                <input type="tel" value={editForm.telefone} onChange={(e) => setEditForm((p) => ({ ...p, telefone: e.target.value }))} placeholder="Ex: (11) 99999-9999" className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Permissão</label>
                <select value={editForm.role} onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value as User["role"] }))} className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none">
                  <option value="admin">Administrador</option>
                  <option value="operador">Operador</option>
                  <option value="viewer">Visualizador</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
                <select value={editForm.ativo ? "ativo" : "inativo"} onChange={(e) => setEditForm((p) => ({ ...p, ativo: e.target.value === "ativo" }))} className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none">
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>
            <div className="px-6 pb-5 flex justify-end gap-3 sticky bottom-0 bg-card border-t border-border pt-4">
              <button onClick={() => setEditModal(null)} className="px-4 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50" style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4" /> Salvar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border">
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Excluir usuário</h3>
                  <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
                </div>
              </div>
              <p className="text-sm text-foreground mb-6">
                Tem certeza que deseja excluir <strong>{deleteModal.nome}</strong>? O acesso dele será removido permanentemente.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal(null)} className="flex-1 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button onClick={() => handleDelete(deleteModal)} disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50">
                  {saving ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tempPassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-foreground">Senha Temporária</h3>
              </div>
              <button onClick={() => setTempPassModal(null)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-muted-foreground mb-4">
                Senha temporária criada para <strong className="text-foreground">{tempPassModal.user.nome}</strong>. Copie e compartilhe com o usuário. Esta senha <strong>não será exibida novamente.</strong>
              </p>
              <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-3 mb-4">
                <code className="flex-1 text-base font-mono font-bold text-foreground tracking-widest">
                  {tempPassModal.password}
                </code>
                <button onClick={handleCopy} className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0" title="Copiar senha">
                  {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-5">
                <p className="text-xs text-amber-800">
                  O usuário pode fazer login com essa senha. Recomende que ele a troque após o primeiro acesso.
                </p>
              </div>
              <button onClick={() => setTempPassModal(null)} className="w-full py-2 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 transition-colors cursor-pointer text-foreground">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
