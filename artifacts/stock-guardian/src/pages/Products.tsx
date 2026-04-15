import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearch } from "wouter";
import { Layout } from "@/components/Layout";
import { StatusBadge } from "@/components/StatusBadge";
import { getProductStatus, getDaysToExpire, Product } from "@/services/mockData";
import { getPage, getCategories, applyProductOverride, getTotalCount, addProduct } from "@/services/productsDB";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search,
  Plus,
  Edit2,
  X,
  Save,
  Loader2,
  Package,
  ChevronLeft,
  ChevronRight,
  Barcode,
} from "lucide-react";
import { toast } from "sonner";

type Filtro = "todos" | "ok" | "atencao" | "critico" | "vencido";

const PAGE_SIZE = 50;

const CATEGORIAS_PADRAO = [
  "Laticínios", "Padaria", "Frios e Embutidos", "Bebidas", "Hortifruti",
  "Carnes", "Congelados", "Mercearia", "Higiene e Beleza", "Limpeza", "Outros",
];

export default function Products() {
  const { canEdit, isAdmin } = useAuth();
  const search_qs = useSearch();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filtro] = useState<Filtro>("todos");
  const [categoria, setCategoria] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPreco, setEditPreco] = useState("");
  const [editCusto, setEditCusto] = useState("");
  const [editValidade, setEditValidade] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [newNome, setNewNome] = useState("");
  const [newBarcode, setNewBarcode] = useState("");
  const [newCategoria, setNewCategoria] = useState("");
  const [newPreco, setNewPreco] = useState("");
  const [newCusto, setNewCusto] = useState("");
  const [newValidade, setNewValidade] = useState("");
  const [newQtd, setNewQtd] = useState("1");

  useEffect(() => {
    const params = new URLSearchParams(search_qs);
    const barcode = params.get("barcode");
    if (barcode && canEdit) {
      setNewBarcode(barcode);
      setNewNome("");
      setNewCategoria("");
      setNewPreco("");
      setNewCusto("");
      setNewValidade("");
      setNewQtd("1");
      setShowAddModal(true);
    }
  }, [search_qs, canEdit]);

  const categories = useMemo(() => getCategories(), []);

  const { items: products, total } = useMemo(() => {
    return getPage(page, PAGE_SIZE, search, categoria);
  }, [page, search, categoria, refreshKey]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearchSubmit = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleEdit = useCallback((p: Product) => {
    setEditingId(p.id);
    setEditPreco(p.preco.toFixed(2));
    setEditCusto(p.custo.toFixed(2));
    setEditValidade(p.validade);
  }, []);

  const handleSaveEdit = useCallback(
    async (p: Product) => {
      setSaveLoading(true);
      await new Promise((r) => setTimeout(r, 200));
      const novoPreco = parseFloat(editPreco.replace(",", "."));
      const novoCusto = parseFloat(editCusto.replace(",", "."));
      applyProductOverride({
        id: p.id,
        preco: isNaN(novoPreco) ? undefined : novoPreco,
        custo: isNaN(novoCusto) ? undefined : novoCusto,
        validade: editValidade || undefined,
      });
      setRefreshKey((k) => k + 1);
      setSaveLoading(false);
      setEditingId(null);
      toast.success("Produto atualizado!");
    },
    [editPreco, editCusto, editValidade]
  );

  const filtros: { value: Filtro; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "ok", label: "OK" },
    { value: "atencao", label: "Atenção" },
    { value: "critico", label: "Crítico" },
    { value: "vencido", label: "Vencido" },
  ];

  return (
    <Layout title="Produtos">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                placeholder="Buscar por nome, código ou categoria..."
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm bg-card border border-border text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              onClick={handleSearchSubmit}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-muted text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            >
              Buscar
            </button>
          </div>

          <select
            value={categoria}
            onChange={(e) => { setCategoria(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-lg text-sm bg-card border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {canEdit && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer shrink-0"
              style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}
            >
              <Plus className="w-4 h-4" />
              Cadastrar
            </button>
          )}
        </div>

        <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2 flex-wrap">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-foreground text-sm">
              {total.toLocaleString("pt-BR")} produto(s) · página {page}/{totalPages}
            </span>
            {search && (
              <span className="text-xs text-muted-foreground">
                — buscando por "{search}"
              </span>
            )}
            {search && (
              <button
                onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" /> Limpar busca
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Produto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Código</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Categoria</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preço</th>
                  {isAdmin && <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Custo</th>}
                  {isAdmin && <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Margem</th>}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Validade</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  {canEdit && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-muted-foreground">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      Nenhum produto encontrado
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const status = getProductStatus(p.validade);
                    const days = getDaysToExpire(p.validade);
                    const isEditing = editingId === p.id;
                    const margem = p.preco > 0 && p.custo > 0 ? ((p.preco - p.custo) / p.custo) * 100 : null;
                    const rowBg =
                      status === "vencido"
                        ? "bg-red-50/50 dark:bg-red-950/20"
                        : status === "critico"
                        ? "bg-orange-50/50 dark:bg-orange-950/20"
                        : "";

                    return (
                      <tr key={p.id} className={`hover:bg-muted/30 transition-colors ${rowBg}`}>
                        <td className="px-5 py-3">
                          <div className="font-medium text-foreground">{p.nome}</div>
                          <div className="text-xs text-muted-foreground">{p.quantidade} unid.</div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {p.codigoBarras}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">{p.categoria}</td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editPreco}
                              onChange={(e) => setEditPreco(e.target.value)}
                              className="w-24 text-right bg-muted border border-border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary"
                              step="0.01"
                            />
                          ) : (
                            `R$ ${p.preco.toFixed(2).replace(".", ",")}`
                          )}
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell text-xs">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editCusto}
                                onChange={(e) => setEditCusto(e.target.value)}
                                className="w-24 text-right bg-muted border border-border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary"
                                step="0.01"
                              />
                            ) : (
                              p.custo > 0 ? `R$ ${p.custo.toFixed(2).replace(".", ",")}` : "—"
                            )}
                          </td>
                        )}
                        {isAdmin && (
                          <td className="px-4 py-3 text-right hidden lg:table-cell text-xs">
                            {margem !== null ? (
                              <span className={margem >= 30 ? "text-emerald-600 font-semibold" : margem >= 15 ? "text-amber-600 font-semibold" : "text-red-600 font-semibold"}>
                                {margem.toFixed(1)}%
                              </span>
                            ) : "—"}
                          </td>
                        )}
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="date"
                              value={editValidade}
                              onChange={(e) => setEditValidade(e.target.value)}
                              className="bg-muted border border-border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary"
                            />
                          ) : (
                            <span className="text-sm text-foreground">
                              {new Date(p.validade + "T00:00:00").toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={status} showDays={days} />
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleSaveEdit(p)}
                                  disabled={saveLoading}
                                  className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {saveLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
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
                                onClick={() => handleEdit(p)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-border flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Mostrando {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} de {total.toLocaleString("pt-BR")}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p;
                  if (totalPages <= 5) p = i + 1;
                  else if (page <= 3) p = i + 1;
                  else if (page >= totalPages - 2) p = totalPages - 4 + i;
                  else p = page - 2 + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        page === p
                          ? "text-white"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                      style={page === p ? { backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" } : {}}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">Cadastrar Produto</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              className="px-6 py-5 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newNome.trim() || !newBarcode.trim()) {
                  toast.error("Nome e código de barras são obrigatórios");
                  return;
                }
                setSaveLoading(true);
                await new Promise((r) => setTimeout(r, 150));
                addProduct({
                  nome: newNome.trim(),
                  codigoBarras: newBarcode.trim(),
                  categoria: newCategoria || "Outros",
                  preco: parseFloat(newPreco.replace(",", ".")) || 0,
                  custo: parseFloat(newCusto.replace(",", ".")) || 0,
                  validade: newValidade || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
                  quantidade: parseInt(newQtd) || 1,
                });
                setRefreshKey((k) => k + 1);
                setSaveLoading(false);
                setShowAddModal(false);
                toast.success(`Produto "${newNome.trim()}" cadastrado com sucesso!`);
                setNewNome(""); setNewBarcode(""); setNewCategoria(""); setNewPreco(""); setNewCusto(""); setNewValidade(""); setNewQtd("1");
              }}
            >
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Código de Barras <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted border border-border focus-within:ring-2 focus-within:ring-primary/30">
                  <Barcode className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={newBarcode}
                    onChange={(e) => setNewBarcode(e.target.value)}
                    placeholder="Ex: 7891000315507"
                    className="flex-1 bg-transparent text-foreground placeholder-muted-foreground outline-none text-sm font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Nome do Produto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  placeholder="Ex: Leite Integral 1L"
                  className="w-full px-3 py-2.5 rounded-lg text-sm bg-muted border border-border text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  required
                  autoFocus={!newBarcode}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Categoria</label>
                <select
                  value={newCategoria}
                  onChange={(e) => setNewCategoria(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                >
                  <option value="">Selecione uma categoria</option>
                  {[...new Set([...CATEGORIAS_PADRAO, ...categories])].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Preço de Venda</label>
                  <input
                    type="number"
                    value={newPreco}
                    onChange={(e) => setNewPreco(e.target.value)}
                    placeholder="0,00"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2.5 rounded-lg text-sm bg-muted border border-border text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Preço de Custo</label>
                  <input
                    type="number"
                    value={newCusto}
                    onChange={(e) => setNewCusto(e.target.value)}
                    placeholder="0,00"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2.5 rounded-lg text-sm bg-muted border border-border text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Validade</label>
                  <input
                    type="date"
                    value={newValidade}
                    onChange={(e) => setNewValidade(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Quantidade</label>
                  <input
                    type="number"
                    value={newQtd}
                    onChange={(e) => setNewQtd(e.target.value)}
                    min="0"
                    className="w-full px-3 py-2.5 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}
                >
                  {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
