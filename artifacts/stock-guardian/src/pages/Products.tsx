import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { StatusBadge } from "@/components/StatusBadge";
import {
  mockProducts as initialProducts,
  getProductStatus,
  getDaysToExpire,
  Product,
  mockAuditLogs,
} from "@/services/mockData";
import { consultarProdutoExterno } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search,
  Plus,
  Edit2,
  Barcode,
  X,
  Save,
  Loader2,
  Package,
  Filter,
} from "lucide-react";

type Filtro = "todos" | "ok" | "atencao" | "critico" | "vencido";

const auditLogs = [...mockAuditLogs];

function addAuditLog(usuario: string, acao: string, detalhes: string) {
  auditLogs.unshift({
    id: Date.now(),
    usuario,
    acao,
    data: new Date().toISOString(),
    detalhes,
  });
}

const products: Product[] = [...initialProducts];

export default function Products() {
  const { canEdit, isAdmin, user } = useAuth();
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPreco, setEditPreco] = useState("");
  const [editValidade, setEditValidade] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [codigoConsulta, setCodigoConsulta] = useState("");
  const [consultando, setConsultando] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [products_state, setProductsState] = useState<Product[]>(products);

  const filteredProducts = useMemo(() => {
    return products_state.filter((p) => {
      const matchSearch =
        !search ||
        p.nome.toLowerCase().includes(search.toLowerCase()) ||
        p.codigoBarras.includes(search) ||
        p.categoria.toLowerCase().includes(search.toLowerCase());

      const status = getProductStatus(p.validade);
      const matchFiltro = filtro === "todos" || status === filtro;

      return matchSearch && matchFiltro;
    });
  }, [products_state, search, filtro]);

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setEditPreco(p.preco.toFixed(2));
    setEditValidade(p.validade);
  };

  const handleSaveEdit = async (p: Product) => {
    setSaveLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const novoPreco = parseFloat(editPreco.replace(",", "."));
    const changes: string[] = [];
    if (novoPreco !== p.preco) changes.push(`preço: R$ ${p.preco.toFixed(2)} → R$ ${novoPreco.toFixed(2)}`);
    if (editValidade !== p.validade) changes.push(`validade: ${p.validade} → ${editValidade}`);

    setProductsState((prev) =>
      prev.map((item) =>
        item.id === p.id
          ? { ...item, preco: isNaN(novoPreco) ? item.preco : novoPreco, validade: editValidade || item.validade }
          : item
      )
    );

    if (changes.length > 0 && user) {
      addAuditLog(user.email, "editou produto", `${p.nome}: ${changes.join(", ")}`);
    }

    setSaveLoading(false);
    setEditingId(null);
  };

  const handleConsultarCodigo = async () => {
    if (!codigoConsulta.trim()) return;
    setConsultando(true);
    try {
      const result = await consultarProdutoExterno(codigoConsulta.trim());
      if (result.encontrado && result.dados) {
        setNewProduct((prev) => ({
          ...prev,
          codigoBarras: codigoConsulta.trim(),
          nome: result.dados!.nome || prev.nome,
          preco: result.dados!.preco || prev.preco,
          categoria: result.dados!.categoria || prev.categoria,
        }));
      } else {
        setNewProduct((prev) => ({ ...prev, codigoBarras: codigoConsulta.trim() }));
      }
    } finally {
      setConsultando(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.nome || !newProduct.codigoBarras || !newProduct.validade) return;
    setSaveLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const product: Product = {
      id: Date.now(),
      nome: newProduct.nome || "",
      codigoBarras: newProduct.codigoBarras || "",
      preco: newProduct.preco || 0,
      validade: newProduct.validade || "",
      categoria: newProduct.categoria || "Geral",
      quantidade: newProduct.quantidade || 1,
    };
    setProductsState((prev) => [product, ...prev]);
    if (user) addAuditLog(user.email, "cadastrou produto", `${product.nome} adicionado ao estoque`);
    setSaveLoading(false);
    setShowAddModal(false);
    setNewProduct({});
    setCodigoConsulta("");
  };

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
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, código ou categoria..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm bg-card border border-border text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="input-search"
            />
          </div>
          {canEdit && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}
              data-testid="btn-add-product"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Produto
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground self-center" />
          {filtros.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                filtro === f.value
                  ? "text-white"
                  : "bg-card border border-border text-muted-foreground hover:border-primary/30"
              }`}
              style={filtro === f.value ? { backgroundColor: "hsl(220, 73%, 16%)" } : {}}
              data-testid={`filter-${f.value}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-foreground text-sm">
              {filteredProducts.length} produto(s) encontrado(s)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Produto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Código</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Categoria</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preço</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Validade</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  {canEdit && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 7 : 6} className="px-5 py-12 text-center text-muted-foreground">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      Nenhum produto encontrado
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const status = getProductStatus(p.validade);
                    const days = getDaysToExpire(p.validade);
                    const isEditing = editingId === p.id;
                    const rowBg =
                      status === "vencido"
                        ? "bg-red-50/50 dark:bg-red-950/20"
                        : status === "critico"
                        ? "bg-orange-50/50 dark:bg-orange-950/20"
                        : "";

                    return (
                      <tr key={p.id} className={`hover:bg-muted/30 transition-colors ${rowBg}`} data-testid={`row-product-${p.id}`}>
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
                          {isEditing && isAdmin ? (
                            <input
                              type="number"
                              value={editPreco}
                              onChange={(e) => setEditPreco(e.target.value)}
                              className="w-24 text-right bg-muted border border-border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary"
                              step="0.01"
                              data-testid="input-edit-preco"
                            />
                          ) : (
                            `R$ ${p.preco.toFixed(2).replace(".", ",")}`
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing && isAdmin ? (
                            <input
                              type="date"
                              value={editValidade}
                              onChange={(e) => setEditValidade(e.target.value)}
                              className="bg-muted border border-border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary"
                              data-testid="input-edit-validade"
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
                                  data-testid={`btn-save-${p.id}`}
                                >
                                  {saveLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                                  data-testid={`btn-cancel-${p.id}`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEdit(p)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                                title={isAdmin ? "Editar preço e validade" : "Editar"}
                                data-testid={`btn-edit-${p.id}`}
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
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Cadastrar Produto</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Barcode lookup */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Código de Barras</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={codigoConsulta}
                      onChange={(e) => setCodigoConsulta(e.target.value)}
                      placeholder="Escanear ou digitar..."
                      className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                      data-testid="input-codigo-barras"
                      onKeyDown={(e) => e.key === "Enter" && handleConsultarCodigo()}
                    />
                  </div>
                  <button
                    onClick={handleConsultarCodigo}
                    disabled={consultando}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer disabled:opacity-50"
                    data-testid="btn-consultar-codigo"
                  >
                    {consultando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Consultar"}
                  </button>
                </div>
                {newProduct.codigoBarras && (
                  <p className="text-xs text-emerald-600 mt-1">
                    {newProduct.nome ? "Produto encontrado na base!" : "Código registrado."}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nome do Produto *</label>
                <input
                  type="text"
                  value={newProduct.nome || ""}
                  onChange={(e) => setNewProduct((p) => ({ ...p, nome: e.target.value }))}
                  placeholder="Nome do produto"
                  className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  data-testid="input-nome"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.preco || ""}
                    onChange={(e) => setNewProduct((p) => ({ ...p, preco: parseFloat(e.target.value) }))}
                    placeholder="0,00"
                    className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                    data-testid="input-preco"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Validade *</label>
                  <input
                    type="date"
                    value={newProduct.validade || ""}
                    onChange={(e) => setNewProduct((p) => ({ ...p, validade: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                    data-testid="input-validade"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Categoria</label>
                  <input
                    type="text"
                    value={newProduct.categoria || ""}
                    onChange={(e) => setNewProduct((p) => ({ ...p, categoria: e.target.value }))}
                    placeholder="Ex: Laticínios"
                    className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                    data-testid="input-categoria"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Quantidade</label>
                  <input
                    type="number"
                    value={newProduct.quantidade || ""}
                    onChange={(e) => setNewProduct((p) => ({ ...p, quantidade: parseInt(e.target.value) }))}
                    placeholder="1"
                    className="w-full px-3 py-2 rounded-lg text-sm bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                    data-testid="input-quantidade"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 flex justify-end gap-3">
              <button
                onClick={() => { setShowAddModal(false); setNewProduct({}); setCodigoConsulta(""); }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                data-testid="btn-cancel-add"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddProduct}
                disabled={saveLoading || !newProduct.nome || !newProduct.codigoBarras || !newProduct.validade}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}
                data-testid="btn-confirm-add"
              >
                {saveLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                  </span>
                ) : (
                  "Cadastrar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
