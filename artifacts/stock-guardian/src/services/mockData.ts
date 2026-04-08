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
  custo: number;
  validade: string;
  categoria: string;
  quantidade: number;
}

export interface Lot {
  id: string;
  produtoCodigo: string;
  produtoNome: string;
  quantidade: number;
  validade: string;
  custo: number;
  precoVenda: number;
  dataRecebimento: string;
  origem: "manual" | "api";
}

export interface ReposicaoRecord {
  id: string;
  produtoCodigo: string;
  produtoNome: string;
  quantidade: number;
  validade: string;
  imagemUrl: string;
  usuario: string;
  usuarioNome: string;
  data: string;
  erro_fifo: boolean;
  inconsistencia_imagem: boolean;
}

export interface Notification {
  id: string;
  tipo: "lote" | "validade" | "fifo" | "promocao" | "sistema";
  mensagem: string;
  destinatario: "todos" | "admin";
  lida: boolean;
  data: string;
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

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export const mockProducts: Product[] = [
  { id: 1, nome: "Leite Integral 1L", codigoBarras: "7891000315507", preco: 4.99, custo: 3.20, validade: addDays(-2), categoria: "Laticínios", quantidade: 45 },
  { id: 2, nome: "Pão de Forma Integral", codigoBarras: "7896019908027", preco: 8.50, custo: 5.50, validade: addDays(3), categoria: "Padaria", quantidade: 20 },
  { id: 3, nome: "Iogurte Natural 400g", codigoBarras: "7891000100103", preco: 3.75, custo: 2.40, validade: addDays(5), categoria: "Laticínios", quantidade: 60 },
  { id: 4, nome: "Suco de Laranja 1L", codigoBarras: "7896010302312", preco: 6.90, custo: 4.30, validade: addDays(12), categoria: "Bebidas", quantidade: 30 },
  { id: 5, nome: "Biscoito Cream Cracker", codigoBarras: "7896003706813", preco: 2.99, custo: 1.80, validade: addDays(45), categoria: "Snacks", quantidade: 100 },
  { id: 6, nome: "Arroz Agulhinha 5kg", codigoBarras: "7896006760909", preco: 24.90, custo: 17.50, validade: addDays(365), categoria: "Grãos", quantidade: 80 },
  { id: 7, nome: "Feijão Carioca 1kg", codigoBarras: "7891012025403", preco: 7.80, custo: 5.20, validade: addDays(400), categoria: "Grãos", quantidade: 55 },
  { id: 8, nome: "Azeite Extra Virgem 500ml", codigoBarras: "5601006006100", preco: 28.50, custo: 19.80, validade: addDays(540), categoria: "Óleos", quantidade: 25 },
  { id: 9, nome: "Macarrão Espaguete 500g", codigoBarras: "7891000239628", preco: 3.49, custo: 2.10, validade: addDays(390), categoria: "Massas", quantidade: 70 },
  { id: 10, nome: "Queijo Mussarela 500g", codigoBarras: "7891000100141", preco: 14.90, custo: 9.80, validade: addDays(2), categoria: "Laticínios", quantidade: 15 },
  { id: 11, nome: "Frango Inteiro Kg", codigoBarras: "7896179200042", preco: 18.90, custo: 12.50, validade: addDays(1), categoria: "Carnes", quantidade: 8 },
  { id: 12, nome: "Detergente Líquido 500ml", codigoBarras: "7891999004609", preco: 2.29, custo: 1.30, validade: addDays(700), categoria: "Limpeza", quantidade: 120 },
  { id: 13, nome: "Chocolate ao Leite 90g", codigoBarras: "7622300951023", preco: 4.50, custo: 2.80, validade: addDays(20), categoria: "Doces", quantidade: 40 },
  { id: 14, nome: "Café Torrado 500g", codigoBarras: "7896197804805", preco: 14.50, custo: 9.00, validade: addDays(100), categoria: "Bebidas", quantidade: 35 },
  { id: 15, nome: "Margarina 500g", codigoBarras: "7891000100325", preco: 5.90, custo: 3.70, validade: addDays(160), categoria: "Laticínios", quantidade: 28 },
];

export const mockInitialLots: Lot[] = [
  {
    id: "lot-001",
    produtoCodigo: "7891000315507",
    produtoNome: "Leite Integral 1L",
    quantidade: 45,
    validade: addDays(-2),
    custo: 3.20,
    precoVenda: 4.99,
    dataRecebimento: addDays(-10),
    origem: "manual",
  },
  {
    id: "lot-002",
    produtoCodigo: "7896019908027",
    produtoNome: "Pão de Forma Integral",
    quantidade: 20,
    validade: addDays(3),
    custo: 5.50,
    precoVenda: 8.50,
    dataRecebimento: addDays(-5),
    origem: "manual",
  },
  {
    id: "lot-003",
    produtoCodigo: "7891000100103",
    produtoNome: "Iogurte Natural 400g",
    quantidade: 60,
    validade: addDays(5),
    custo: 2.40,
    precoVenda: 3.75,
    dataRecebimento: addDays(-8),
    origem: "manual",
  },
  {
    id: "lot-004",
    produtoCodigo: "7896179200042",
    produtoNome: "Frango Inteiro Kg",
    quantidade: 8,
    validade: addDays(1),
    custo: 12.50,
    precoVenda: 18.90,
    dataRecebimento: addDays(-3),
    origem: "manual",
  },
  {
    id: "lot-005",
    produtoCodigo: "7891000100141",
    produtoNome: "Queijo Mussarela 500g",
    quantidade: 15,
    validade: addDays(2),
    custo: 9.80,
    precoVenda: 14.90,
    dataRecebimento: addDays(-7),
    origem: "manual",
  },
];

export const mockInitialReposicoes: ReposicaoRecord[] = [
  {
    id: "rep-001",
    produtoCodigo: "7891000315507",
    produtoNome: "Leite Integral 1L",
    quantidade: 24,
    validade: addDays(30),
    imagemUrl: "",
    usuario: "carlos@stockguardian.com",
    usuarioNome: "Carlos Operador",
    data: new Date(Date.now() - 86400000 * 2).toISOString(),
    erro_fifo: false,
    inconsistencia_imagem: false,
  },
  {
    id: "rep-002",
    produtoCodigo: "7896019908027",
    produtoNome: "Pão de Forma Integral",
    quantidade: 12,
    validade: addDays(-5),
    imagemUrl: "",
    usuario: "carlos@stockguardian.com",
    usuarioNome: "Carlos Operador",
    data: new Date(Date.now() - 86400000 * 3).toISOString(),
    erro_fifo: true,
    inconsistencia_imagem: false,
  },
  {
    id: "rep-003",
    produtoCodigo: "7891000100103",
    produtoNome: "Iogurte Natural 400g",
    quantidade: 30,
    validade: addDays(15),
    imagemUrl: "",
    usuario: "admin@stockguardian.com",
    usuarioNome: "Admin Master",
    data: new Date(Date.now() - 86400000).toISOString(),
    erro_fifo: false,
    inconsistencia_imagem: false,
  },
];

export const mockInitialNotifications: Notification[] = [
  {
    id: "notif-001",
    tipo: "validade",
    mensagem: "Frango Inteiro Kg vence em 1 dia — tome ação imediata.",
    destinatario: "todos",
    lida: false,
    data: new Date().toISOString(),
  },
  {
    id: "notif-002",
    tipo: "validade",
    mensagem: "Leite Integral 1L está vencido — retire do estoque.",
    destinatario: "todos",
    lida: false,
    data: new Date().toISOString(),
  },
  {
    id: "notif-003",
    tipo: "fifo",
    mensagem: "Carlos Operador não respeitou o rodízio de validade no Pão de Forma Integral.",
    destinatario: "admin",
    lida: false,
    data: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

export const mockAuditLogs: AuditLog[] = [
  { id: 1, usuario: "admin@stockguardian.com", acao: "alterou preço", data: new Date(Date.now() - 86400000 * 2).toISOString(), detalhes: "Leite Integral 1L: R$ 4.50 → R$ 4.99" },
  { id: 2, usuario: "carlos@stockguardian.com", acao: "registrou reposição", data: new Date(Date.now() - 86400000 * 2).toISOString(), detalhes: "Leite Integral 1L — 24 unidades" },
  { id: 3, usuario: "carlos@stockguardian.com", acao: "erro FIFO detectado", data: new Date(Date.now() - 86400000 * 3).toISOString(), detalhes: "Pão de Forma Integral — validade incorreta" },
  { id: 4, usuario: "admin@stockguardian.com", acao: "sincronizou API", data: new Date(Date.now() - 86400000 * 4).toISOString(), detalhes: "3 lotes recebidos via integração externa" },
  { id: 5, usuario: "admin@stockguardian.com", acao: "cadastrou usuário", data: new Date(Date.now() - 86400000 * 5).toISOString(), detalhes: "maria@stockguardian.com criada com role viewer" },
];

export function getProductStatus(validade: string): ProductStatus {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataValidade = new Date(validade + (validade.includes("T") ? "" : "T00:00:00"));
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
  const dataValidade = new Date(validade + (validade.includes("T") ? "" : "T00:00:00"));
  dataValidade.setHours(0, 0, 0, 0);
  const diffMs = dataValidade.getTime() - hoje.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
