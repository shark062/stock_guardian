import { Product } from "./mockData";

let _loaded = false;
let _products: Product[] = [];
let _byBarcode: Map<string, Product> = new Map();
let _byId: Map<number, Product> = new Map();
let _initPromise: Promise<void> | null = null;

const PRODUCTS_CACHE_KEY = "sg_products_cache_v3";
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface ProductsCache {
  products: Product[];
  timestamp: number;
}

function loadProductsCache(): Product[] | null {
  try {
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (!raw) return null;
    const cache: ProductsCache = JSON.parse(raw);
    if (Date.now() - cache.timestamp > CACHE_MAX_AGE_MS) return null;
    return cache.products;
  } catch {
    return null;
  }
}

function saveProductsCache(products: Product[]) {
  try {
    const cache: ProductsCache = { products, timestamp: Date.now() };
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn("[productsDB] Cache não salvo:", e);
  }
}

function _loadIntoMemory(products: Product[]) {
  _products = products;
  _byBarcode = new Map(_products.map((p) => [p.codigoBarras, p]));
  _byId = new Map(_products.map((p) => [p.id, p]));
  _loaded = true;
}

async function _doInit(): Promise<void> {
  const { ensureProductsTable, loadProductsFromNeon, countProducts } = await import("./neonDB");

  await ensureProductsTable();
  const count = await countProducts();

  if (count > 0) {
    const cached = loadProductsCache();
    if (cached && cached.length === count) {
      _loadIntoMemory(cached);
      _refreshFromNeonBackground();
      return;
    }
    const neonProds = await loadProductsFromNeon();
    if (neonProds.length > 0) {
      const products = neonProds.map((r) => ({
        id: r.id, nome: r.nome, codigoBarras: r.codigoBarras,
        preco: r.preco, custo: r.custo, validade: r.validade,
        categoria: r.categoria, quantidade: r.quantidade,
      }));
      saveProductsCache(products);
      _loadIntoMemory(products);
      return;
    }
  }

  _loadIntoMemory([]);
}

async function _refreshFromNeonBackground() {
  try {
    const { loadProductsFromNeon, countProducts } = await import("./neonDB");
    const count = await countProducts();
    if (count !== _products.length) {
      const neonProds = await loadProductsFromNeon();
      if (neonProds.length > 0) {
        const products = neonProds.map((r) => ({
          id: r.id, nome: r.nome, codigoBarras: r.codigoBarras,
          preco: r.preco, custo: r.custo, validade: r.validade,
          categoria: r.categoria, quantidade: r.quantidade,
        }));
        saveProductsCache(products);
        _loadIntoMemory(products);
      }
    }
  } catch {}
}

export function initProducts(): Promise<void> {
  if (_loaded) return Promise.resolve();
  if (_initPromise) return _initPromise;
  _initPromise = _doInit().catch((e) => {
    console.error("[productsDB] Falha ao inicializar produtos:", e);
    _loaded = true;
  });
  return _initPromise;
}

export function getProductByBarcode(barcode: string): Product | undefined {
  return _byBarcode.get(barcode);
}

export function searchProducts(query: string, limit = 50): Product[] {
  if (!_loaded || !query.trim()) return _products.slice(0, limit);
  const q = query.toLowerCase();
  const results: Product[] = [];
  for (const p of _products) {
    if (
      p.nome.toLowerCase().includes(q) ||
      p.codigoBarras.includes(q) ||
      p.categoria.toLowerCase().includes(q)
    ) {
      results.push(p);
      if (results.length >= limit) break;
    }
  }
  return results;
}

export function getPage(
  page: number, pageSize: number, query = "", categoria = ""
): { items: Product[]; total: number } {
  if (!_loaded) return { items: [], total: 0 };
  let list = _products;
  if (query || categoria) {
    const q = query.toLowerCase();
    const cat = categoria.toLowerCase();
    list = _products.filter((p) => {
      const matchQ =
        !q ||
        p.nome.toLowerCase().includes(q) ||
        p.codigoBarras.includes(q) ||
        p.categoria.toLowerCase().includes(q);
      const matchCat = !cat || p.categoria.toLowerCase() === cat;
      return matchQ && matchCat;
    });
  }
  const start = (page - 1) * pageSize;
  return { items: list.slice(start, start + pageSize), total: list.length };
}

export function getAllProducts(): Product[] {
  return _products;
}

export function getCategories(): string[] {
  const cats = new Set(_products.map((p) => p.categoria));
  return Array.from(cats).sort();
}

export function getTotalCount(): number {
  return _products.length;
}

export interface NewProduct {
  nome: string;
  codigoBarras: string;
  categoria: string;
  preco: number;
  custo: number;
  validade: string;
  quantidade: number;
}

export function addProduct(np: NewProduct): Product {
  const maxId = _products.reduce((m, p) => Math.max(m, p.id), 0);
  const p: Product = { id: maxId + 1, ...np };
  _products.push(p);
  _byBarcode.set(p.codigoBarras, p);
  _byId.set(p.id, p);
  localStorage.removeItem(PRODUCTS_CACHE_KEY);
  import("./neonDB").then(({ saveCustomProductToNeon }) => {
    saveCustomProductToNeon(p).catch(() => {});
  });
  return p;
}

export function getProductById(id: number): Product | undefined {
  return _byId.get(id);
}

export function invalidateCache() {
  localStorage.removeItem(PRODUCTS_CACHE_KEY);
  _loaded = false;
  _initPromise = null;
  _products = [];
  _byBarcode = new Map();
  _byId = new Map();
}

export interface ProductOverride {
  id: number;
  preco?: number;
  custo?: number;
  quantidade?: number;
  validade?: string;
}

export function applyProductOverride(ov: ProductOverride) {
  const p = _byId.get(ov.id);
  if (p) {
    if (ov.preco !== undefined) p.preco = ov.preco;
    if (ov.custo !== undefined) p.custo = ov.custo;
    if (ov.quantidade !== undefined) p.quantidade = ov.quantidade;
    if (ov.validade !== undefined) p.validade = ov.validade;
    localStorage.removeItem(PRODUCTS_CACHE_KEY);
    import("./neonDB").then(({ saveCustomProductToNeon }) => {
      saveCustomProductToNeon(p).catch(() => {});
    });
  }
}

export function applyBulkOverrides(ovs: ProductOverride[]) {
  let changed = false;
  ovs.forEach((ov) => {
    const p = _byId.get(ov.id);
    if (p) {
      if (ov.preco !== undefined) p.preco = ov.preco;
      if (ov.custo !== undefined) p.custo = ov.custo;
      if (ov.quantidade !== undefined) p.quantidade = ov.quantidade;
      if (ov.validade !== undefined) p.validade = ov.validade;
      changed = true;
      import("./neonDB").then(({ saveCustomProductToNeon }) => {
        saveCustomProductToNeon(p).catch(() => {});
      });
    }
  });
  if (changed) localStorage.removeItem(PRODUCTS_CACHE_KEY);
}
