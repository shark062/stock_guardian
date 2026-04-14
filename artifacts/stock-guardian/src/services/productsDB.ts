import { realProducts, RealProduct } from "./realProducts";
import { Product } from "./mockData";

let _loaded = false;
let _products: Product[] = [];
let _byBarcode: Map<string, Product> = new Map();
let _byId: Map<number, Product> = new Map();

function ensureLoaded() {
  if (_loaded) return;
  _products = realProducts.map((r: RealProduct): Product => ({
    id: r.id,
    nome: r.nome,
    codigoBarras: r.codigoBarras,
    preco: r.preco,
    custo: r.custo,
    validade: r.validade,
    categoria: r.categoria,
    quantidade: r.quantidade,
  }));
  _byBarcode = new Map(_products.map((p) => [p.codigoBarras, p]));
  _byId = new Map(_products.map((p) => [p.id, p]));

  // Apply overrides from localStorage
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
  _loaded = true;
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
  ensureLoaded();
  return _byBarcode.get(barcode);
}

export function searchProducts(query: string, limit = 50): Product[] {
  ensureLoaded();
  if (!query.trim()) return _products.slice(0, limit);
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

export function getPage(page: number, pageSize: number, query = "", categoria = ""): { items: Product[]; total: number } {
  ensureLoaded();
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
  ensureLoaded();
  return _products;
}

export function getCategories(): string[] {
  ensureLoaded();
  const cats = new Set(_products.map((p) => p.categoria));
  return Array.from(cats).sort();
}

export function getTotalCount(): number {
  return realProducts.length;
}
