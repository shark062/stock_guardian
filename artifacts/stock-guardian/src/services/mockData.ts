export type Role = "admin" | "operador" | "viewer";

export interface User {
  id: number;
  nome: string;
  email: string;
  role: Role;
  ativo: boolean;
  criadoEm: string;
}

export interface Product {
  id: number;
  nome: string;
  codigoBarras: string;
  preco: number;
  validade: string;
  categoria: string;
  quantidade: number;
}

export type ProductStatus = "ok" | "atencao" | "critico" | "vencido";

export interface AuditLog {
  id: number;
  usuario: string;
  acao: string;
  data: string;
  detalhes: string;
}

export const mockUsers: User[] = [
  { id: 1, nome: "Admin Master", email: "admin@stockguardian.com", role: "admin", ativo: true, criadoEm: "2024-01-15" },
  { id: 2, nome: "Carlos Operador", email: "carlos@stockguardian.com", role: "operador", ativo: true, criadoEm: "2024-02-10" },
  { id: 3, nome: "Fernanda Viewer", email: "fernanda@stockguardian.com", role: "viewer", ativo: true, criadoEm: "2024-03-05" },
  { id: 4, nome: "João Silva", email: "joao@stockguardian.com", role: "operador", ativo: false, criadoEm: "2024-01-20" },
  { id: 5, nome: "Maria Santos", email: "maria@stockguardian.com", role: "viewer", ativo: true, criadoEm: "2024-04-01" },
];

export const mockProducts: Product[] = [
  { id: 1, nome: "Leite Integral 1L", codigoBarras: "7891000315507", preco: 4.99, validade: "2024-04-05", categoria: "Laticínios", quantidade: 45 },
  { id: 2, nome: "Pão de Forma Integral", codigoBarras: "7896019908027", preco: 8.50, validade: "2024-04-10", categoria: "Padaria", quantidade: 20 },
  { id: 3, nome: "Iogurte Natural 400g", codigoBarras: "7891000100103", preco: 3.75, validade: "2024-04-15", categoria: "Laticínios", quantidade: 60 },
  { id: 4, nome: "Suco de Laranja 1L", codigoBarras: "7896010302312", preco: 6.90, validade: "2024-04-30", categoria: "Bebidas", quantidade: 30 },
  { id: 5, nome: "Biscoito Cream Cracker", codigoBarras: "7896003706813", preco: 2.99, validade: "2024-06-20", categoria: "Snacks", quantidade: 100 },
  { id: 6, nome: "Arroz Agulhinha 5kg", codigoBarras: "7896006760909", preco: 24.90, validade: "2025-08-15", categoria: "Grãos", quantidade: 80 },
  { id: 7, nome: "Feijão Carioca 1kg", codigoBarras: "7891012025403", preco: 7.80, validade: "2025-10-20", categoria: "Grãos", quantidade: 55 },
  { id: 8, nome: "Azeite Extra Virgem 500ml", codigoBarras: "5601006006100", preco: 28.50, validade: "2025-12-31", categoria: "Óleos", quantidade: 25 },
  { id: 9, nome: "Macarrão Espaguete 500g", codigoBarras: "7891000239628", preco: 3.49, validade: "2025-09-30", categoria: "Massas", quantidade: 70 },
  { id: 10, nome: "Queijo Mussarela 500g", codigoBarras: "7891000100141", preco: 14.90, validade: "2024-04-08", categoria: "Laticínios", quantidade: 15 },
  { id: 11, nome: "Frango Inteiro Kg", codigoBarras: "7896179200042", preco: 18.90, validade: "2024-04-03", categoria: "Carnes", quantidade: 8 },
  { id: 12, nome: "Detergente Líquido 500ml", codigoBarras: "7891999004609", preco: 2.29, validade: "2026-05-10", categoria: "Limpeza", quantidade: 120 },
  { id: 13, nome: "Chocolate ao Leite 90g", codigoBarras: "7622300951023", preco: 4.50, validade: "2024-05-15", categoria: "Doces", quantidade: 40 },
  { id: 14, nome: "Café Torrado 500g", codigoBarras: "7896197804805", preco: 14.50, validade: "2024-07-20", categoria: "Bebidas", quantidade: 35 },
  { id: 15, nome: "Margarina 500g", codigoBarras: "7891000100325", preco: 5.90, validade: "2024-09-10", categoria: "Laticínios", quantidade: 28 },
];

export const mockAuditLogs: AuditLog[] = [
  { id: 1, usuario: "admin@stockguardian.com", acao: "alterou preço", data: "2024-04-08T10:30:00", detalhes: "Leite Integral 1L: R$ 4.50 → R$ 4.99" },
  { id: 2, usuario: "carlos@stockguardian.com", acao: "cadastrou produto", data: "2024-04-07T14:15:00", detalhes: "Chocolate ao Leite 90g adicionado ao estoque" },
  { id: 3, usuario: "admin@stockguardian.com", acao: "alterou validade", data: "2024-04-06T09:00:00", detalhes: "Queijo Mussarela 500g: 2024-04-05 → 2024-04-08" },
  { id: 4, usuario: "admin@stockguardian.com", acao: "cadastrou usuário", data: "2024-04-05T16:45:00", detalhes: "maria@stockguardian.com criada com role viewer" },
  { id: 5, usuario: "carlos@stockguardian.com", acao: "editou produto", data: "2024-04-04T11:20:00", detalhes: "Arroz Agulhinha 5kg: quantidade atualizada para 80" },
];

export const mockProductsExternal: Record<string, Partial<Product>> = {
  "7891000315507": { nome: "Leite Integral 1L", preco: 4.99, categoria: "Laticínios" },
  "7896019908027": { nome: "Pão de Forma Integral", preco: 8.50, categoria: "Padaria" },
  "7891000100103": { nome: "Iogurte Natural 400g", preco: 3.75, categoria: "Laticínios" },
  "7896006760909": { nome: "Arroz Agulhinha 5kg", preco: 24.90, categoria: "Grãos" },
  "7891012025403": { nome: "Feijão Carioca 1kg", preco: 7.80, categoria: "Grãos" },
  "7891000239628": { nome: "Macarrão Espaguete 500g", preco: 3.49, categoria: "Massas" },
  "7622300951023": { nome: "Chocolate ao Leite 90g", preco: 4.50, categoria: "Doces" },
};

export function getProductStatus(validade: string): ProductStatus {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataValidade = new Date(validade);
  dataValidade.setHours(0, 0, 0, 0);
  const diffMs = dataValidade.getTime() - hoje.getTime();
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return "vencido";
  if (diffDias <= 7) return "critico";
  if (diffDias <= 30) return "atencao";
  return "ok";
}

export function getDaysToExpire(validade: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataValidade = new Date(validade);
  dataValidade.setHours(0, 0, 0, 0);
  const diffMs = dataValidade.getTime() - hoje.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
