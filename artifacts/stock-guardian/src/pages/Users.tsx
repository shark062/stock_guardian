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
} from "lucide-react";

const roleConfig = {
  admin: {
    label: "Administrador",
    icon: Shield,
    className: "bg-blue-100 text-blue-800 border border-blue-200",
    iconColor: "text-blue-600",
  },
  operador: {
    label: "Operador",
    icon: Wrench,
    className: "bg-amber-100 text-amber-800 border border-amber-200",
    iconColor: "text-amber-600",
  },
  viewer: {
    label: "Visualizador",
    icon: Eye,
    className: "bg-gray-100 text-gray-700 border border-gray-200",
    iconColor: "text-gray-500",
  },
};

const usersState: User[] = [...mockUsers];

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>(usersState);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRole, setEditRole] = useState<User["role"]>("viewer");
  const [editAtivo, setEditAtivo] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ nome: "", email: "", role: "viewer" as User["role"] });
  const [saving, setSaving] = useState(false);

  const handleEdit = (u: User) => {
    setEditingId(u.id);
    setEditRole(u.role);
    setEditAtivo(u.ativo);
  };

  const handleSave = async (u: User) => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setUsers((prev) =>
      prev.map((item) =>
        item.id === u.id ? { ...item, role: editRole, ativo: editAtivo } : item
      )
    );
    setSaving(false);
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!newUser.nome || !newUser.email) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    const user: User = {
      id: Date.now(),
      nome: newUser.nome,
      email: newUser.email,
      role: newUser.role,
      ativo: true,
      criadoEm: new Date().toISOString().split("T")[0],
    };
    setUsers((prev) => [user, ...prev]);
    setSaving(false);
    setShowAddModal(false);
    setNewUser({ nome: "", email: "", role: "viewer" });
  };

  return (
    <Layout title="Usuários">
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{users.length} usuário(s) cadastrados</span>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}
              data-testid="btn-add-user"
            >
              <Plus className="w-4 h-4" />
              Novo Usuário
            </button>
          )}
        </div>

        {/* Roles explanation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(Object.entries(roleConfig) as [User["role"], typeof roleConfig[keyof typeof roleConfig]][]).map(([role, cfg]) => (
            <div key={role} className="bg-card rounded-xl border border-card-border p-4 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <cfg.icon className={`w-4 h-4 ${cfg.iconColor}`} />
                <span className="text-sm font-semibold text-foreground">{cfg.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {role === "admin" && "Acesso total ao sistema: pode editar, excluir e gerenciar usuários."}
                {role === "operador" && "Pode cadastrar e editar produtos, mas não gerencia usuários."}
                {role === "viewer" && "Apenas visualiza dados. Não pode fazer alterações."}
              </p>
              <div className="mt-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {users.filter((u) => u.role === role && u.ativo).length} ativo(s)
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Users table */}
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
                  {isAdmin && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => {
                  const isEditing = editingId === u.id;
                  const cfg = roleConfig[u.role];
                  return (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-user-${u.id}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}
                          >
                            {u.nome.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground">{u.nome}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">{u.email}</td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as User["role"])}
                            className="px-2 py-1 rounded text-xs bg-muted border border-border text-foreground outline-none"
                            data-testid={`select-role-${u.id}`}
                          >
                            <option value="admin">Administrador</option>
                            <option value="operador">Operador</option>
                            <option value="viewer">Visualizador</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.className}`}>
                            <cfg.icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={editAtivo ? "ativo" : "inativo"}
                            onChange={(e) => setEditAtivo(e.target.value === "ativo")}
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
                                data-testid={`btn-save-user-${u.id}`}
                              >
                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEdit(u)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                              data-testid={`btn-edit-user-${u.id}`}
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Novo Usuário</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
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
                  data-testid="input-user-nome"
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
                  data-testid="input-user-email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Permissão</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value as User["role"] }))}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  data-testid="select-user-role"
                >
                  <option value="admin">Administrador</option>
                  <option value="operador">Operador</option>
                  <option value="viewer">Visualizador</option>
                </select>
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
                data-testid="btn-confirm-add-user"
              >
                {saving ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</span> : "Criar Usuário"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
