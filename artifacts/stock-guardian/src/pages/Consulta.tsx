import { useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { getProductByBarcode, searchProducts } from "@/services/productsDB";
import { Product } from "@/services/mockData";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import {
  Barcode,
  Search,
  Package,
  DollarSign,
  TrendingUp,
  Tag,
  ChevronRight,
  X,
  ScanLine,
} from "lucide-react";
import { cn } from "@/lib/utils";

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pct(val: number) {
  return `${val.toFixed(1)}%`;
}

function getMargemColor(m: number) {
  if (m >= 30) return "text-emerald-600";
  if (m >= 15) return "text-amber-600";
  return "text-red-600";
}

function ProductCard({ product, isAdmin }: { product: Product; isAdmin: boolean }) {
  const margem = product.preco - product.custo;
  const margemPct = product.custo > 0 ? (margem / product.custo) * 100 : 0;

  return (
    <div className="bg-card rounded-2xl border border-card-border shadow-lg overflow-hidden animate-fade-in">
      <div className="px-6 py-5 border-b border-border flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "hsl(40, 54%, 54%)" }}
        >
          <Package className="w-5 h-5" style={{ color: "hsl(220, 73%, 12%)" }} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-foreground text-base leading-tight truncate">{product.nome}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{product.categoria}</p>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Barcode className="w-3.5 h-3.5 shrink-0" />
          <span className="font-mono">{product.codigoBarras}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/40 rounded-xl p-4 text-center">
            <Tag className="w-4 h-4 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-foreground">{fmt(product.preco)}</p>
            <p className="text-xs text-muted-foreground mt-1">Preço de Venda</p>
          </div>

          <div className="bg-muted/40 rounded-xl p-4 text-center">
            <Package className="w-4 h-4 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold text-foreground">{product.quantidade}</p>
            <p className="text-xs text-muted-foreground mt-1">Em Estoque</p>
          </div>
        </div>

        {isAdmin && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 text-center border border-blue-100 dark:border-blue-900">
              <DollarSign className="w-4 h-4 mx-auto mb-2 text-blue-600" />
              <p className="text-xl font-bold text-blue-700">{fmt(product.custo)}</p>
              <p className="text-xs text-blue-600 mt-1">Preço de Custo</p>
            </div>

            <div
              className={cn(
                "rounded-xl p-4 text-center border",
                margemPct >= 30
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900"
                  : margemPct >= 15
                  ? "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900"
                  : "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900"
              )}
            >
              <TrendingUp className={cn("w-4 h-4 mx-auto mb-2", getMargemColor(margemPct))} />
              <p className={cn("text-xl font-bold", getMargemColor(margemPct))}>
                {pct(margemPct)}
              </p>
              <p className={cn("text-xs mt-1", getMargemColor(margemPct))}>
                Margem ({fmt(margem)})
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Consulta() {
  const { isAdmin } = useAuth();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Product | null>(null);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBarcode = (code: string) => {
    setShowScanner(false);
    handleSearch(code);
    setQuery(code);
  };

  const handleSearch = (val: string) => {
    setQuery(val);
    setNotFound(false);
    setResult(null);

    if (!val.trim()) {
      setSuggestions([]);
      return;
    }

    // Try exact barcode first
    const exact = getProductByBarcode(val.trim());
    if (exact) {
      setResult(exact);
      setSuggestions([]);
      return;
    }

    // Show suggestions
    const sugs = searchProducts(val.trim(), 8);
    setSuggestions(sugs);
  };

  const handleSelect = (p: Product) => {
    setResult(p);
    setSuggestions([]);
    setQuery(p.nome);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (suggestions.length === 1) {
        handleSelect(suggestions[0]);
      } else if (suggestions.length === 0 && query.trim()) {
        setNotFound(true);
      }
    }
    if (e.key === "Escape") {
      handleClear();
    }
  };

  const handleClear = () => {
    setQuery("");
    setResult(null);
    setSuggestions([]);
    setNotFound(false);
    inputRef.current?.focus();
  };

  return (
    <Layout title="Consulta de Produto">
      {showScanner && (
        <BarcodeScanner
          onDetected={handleBarcode}
          onClose={() => setShowScanner(false)}
        />
      )}
      <div className="max-w-lg mx-auto space-y-5">
        <div className="bg-card rounded-2xl border border-card-border shadow-sm p-5">
          <p className="text-sm text-muted-foreground mb-4">
            Digite o código de barras ou nome do produto para consultar
          </p>

          <div className="relative">
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted border border-border focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Barcode className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Código de barras ou nome..."
                className="flex-1 bg-transparent text-foreground placeholder-muted-foreground outline-none text-sm"
                autoFocus
              />
              {query && (
                <button onClick={handleClear} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowScanner(true)}
                className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                title="Escanear código de barras"
              >
                <ScanLine className="w-4 h-4" />
              </button>
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>

            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-10 overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelect(s)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors cursor-pointer text-left border-b border-border last:border-0"
                  >
                    <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.nome}</p>
                      <p className="text-xs text-muted-foreground">{s.categoria} · {s.codigoBarras}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-foreground">{fmt(s.preco)}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {notFound && (
            <div className="mt-3 text-center py-4 text-muted-foreground text-sm">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Produto não encontrado no catálogo
            </div>
          )}
        </div>

        {result && <ProductCard product={result} isAdmin={isAdmin} />}

        {!result && !query && (
          <div className="text-center py-8 text-muted-foreground">
            <Barcode className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Escaneie ou digite o código de barras</p>
            {isAdmin && (
              <p className="text-xs mt-1 opacity-70">Como administrador, você verá o custo e margem</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
