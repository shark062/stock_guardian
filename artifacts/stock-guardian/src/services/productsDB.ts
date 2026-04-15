import { Product } from "./mockData";

let _loaded = false;
let _products: Product[] = [];
let _byBarcode: Map<string, Product> = new Map();
let _byId: Map<number, Product> = new Map();
let _initPromise: Promise<void> | null = null;

const PRODUCTS_CACHE_KEY = "sg_products_cache_v3";
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const CUSTOM_PRODUCTS_KEY = "sg_custom_products";

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

export function loadCustomProducts(): Product[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomProductsLocal(products: Product[]) {
  localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(products));
}

export interface ProductOverride {
  id: number;
  preco?: number;
  custo?: number;
  quantidade?: number;
  validade?: string;
}

const OVERRIDES_KEY = "sg_product_overrides";

function loadOverrides(): ProductOverride[] {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOverrides(overrides: ProductOverride[]) {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
}

function _applyOverridesToMemory() {
  const overrides = loadOverrides();
  overrides.forEach((ov) => {
    const p = _byId.get(ov.id);
    if (p) {
      if (ov.preco !== undefined) p.preco = ov.preco;
      if (ov.custo !== undefined) p.custo = ov.custo;
      if (ov.quantidade !== undefined) p.quantidade = ov.quantidade;
      if (ov.validade !== undefined) p.validade = ov.validade;
    }
  });
}

function _loadIntoMemory(base: Product[]) {
  const custom = loadCustomProducts();
  const barcodeSet = new Set(base.map((p) => p.codigoBarras));
  const customFiltered = custom.filter((p) => !barcodeSet.has(p.codigoBarras));
  _products = [...base, ...customFiltered];
  _byBarcode = new Map(_products.map((p) => [p.codigoBarras, p]));
  _byId = new Map(_products.map((p) => [p.id, p]));
  _applyOverridesToMemory();
  _loaded = true;
}

async function _doInit(): Promise<void> {
  // 1. Try localStorage cache first (instant)
  const cached = loadProductsCache();
  if (cached && cached.length > 0) {
    _loadIntoMemory(cached);
    // Try to load from Neon in background to refresh cache if needed
    _tryNeonInBackground();
    return;
  }

  // 2. Try Neon directly
  try {
    const { loadProductsFromNeon, ensureProductsTable, countProducts } = await import("./neonDB");
    await ensureProductsTable();
    const count = await countProducts();
    if (count > 0) {
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
  } catch (e) {
    console.warn("[productsDB] Neon indisponível, usando realProducts:", e);
  }

  // 3. Dynamic import of realProducts (separate bundle chunk, only loaded once)
  const { realProducts } = await import("./realProducts");
  const products: Product[] = (realProducts as any[]).map((r) => ({
    id: r.id, nome: r.nome, codigoBarras: r.codigoBarras,
    preco: r.preco, custo: r.custo, validade: r.validade,
    categoria: r.categoria, quantidade: r.quantidade,
  }));

  saveProductsCache(products);
  _loadIntoMemory(products);

  // Seed to Neon in background (non-blocking)
  _seedNeonBackground(products);
}

async function _tryNeonInBackground() {
  try {
    const { loadProductsFromNeon, countProducts } = await import("./neonDB");
    const count = await countProducts();
    if (count === 0) {
      _seedNeonBackground(_products);
    } else if (count !== _products.length) {
      const neonProds = await loadProductsFromNeon();
      if (neonProds.length > _products.length) {
        const products = neonProds.map((r) => ({
          id: r.id, nome: r.nome, codigoBarras: r.codigoBarras,
          preco: r.preco, custo: r.custo, validade: r.validade,
          categoria: r.categoria, quantidade: r.quantidade,
        }));
        saveProductsCache(products);
      }
    }
  } catch {}
}

async function _seedNeonBackground(products: Product[]) {
  try {
    const { ensureProductsTable, countProducts, seedProductsToNeon } = await import("./neonDB");
    await ensureProductsTable();
    const count = await countProducts();
    if (count === 0) {
      await seedProductsToNeon(products);
    }
  } catch (e) {
    console.warn("[productsDB] Seeding Neon falhou:", e);
  }
}

export function initProducts(): Promise<void> {
  if (_loaded) return Promise.resolve();
  if (_initPromise) return _initPromise;
  _initPromise = _doInit().catch((e) => {
    console.error("[productsDB] Falha ao inicializar produtos:", e);
    _loaded = true; // prevent infinite retry
  });
  return _initPromise;
}

function ensureLoaded() {
  // No-op: data is available if _loaded = true (set by initProducts)
}

export function applyProductOverride(ov: ProductOverride) {
  ensureLoaded();
  const existing = loadOverrides();
  const idx = existing.findIndex((e) => e.id === ov.id);
  if (idx >= 0) {
    existing[idx] = { ...existing[idx], ...ov };
  } else {
    existing.push(ov);
  }
  saveOverrides(existing);
  const p = _byId.get(ov.id);
  if (p) {
    if (ov.preco !== undefined) p.preco = ov.preco;
    if (ov.custo !== undefined) p.custo = ov.custo;
    if (ov.quantidade !== undefined) p.quantidade = ov.quantidade;
    if (ov.validade !== undefined) p.validade = ov.validade;
  }
}

export function applyBulkOverrides(ovs: ProductOverride[]) {
  ensureLoaded();
  const existing = loadOverrides();
  ovs.forEach((ov) => {
    const idx = existing.findIndex((e) => e.id === ov.id);
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...ov };
    } else {
      existing.push(ov);
    }
    const p = _byId.get(ov.id);
    if (p) {
      if (ov.preco !== undefined) p.preco = ov.preco;
      if (ov.custo !== undefined) p.custo = ov.custo;
      if (ov.quantidade !== undefined) p.quantidade = ov.quantidade;
      if (ov.validade !== undefined) p.validade = ov.validade;
    }
  });
  saveOverrides(existing);
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
  const existing = loadCustomProducts();
  existing.push(p);
  saveCustomProductsLocal(existing);
  // Persist to Neon in background
  import("./neonDB").then(({ saveCustomProductToNeon }) => {
    saveCustomProductToNeon(p).catch(() => {});
  });
  return p;
}
