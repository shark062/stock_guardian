import { realProducts } from "./realProducts";

export type Role = "admin" | "operador" | "viewer" | "gestor" | "conferente" | "repositor";

export interface User {
  id: number;
  nome: string;
  email: string;
  username: string;
  telefone?: string;
  role: Role;
  grupo?: string;
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
  { id: 1, nome: "Alex Sousa", username: "Alex_Sousa", email: "alex@stockguardian.com", role: "admin", ativo: true, criadoEm: "2024-01-15" },
  { id: 2, nome: "Carlos Operador", username: "carlos", email: "carlos@stockguardian.com", role: "operador", ativo: true, criadoEm: "2024-02-10" },
  { id: 3, nome: "Fernanda Viewer", username: "fernanda", email: "fernanda@stockguardian.com", role: "viewer", ativo: true, criadoEm: "2024-03-05" },
  { id: 4, nome: "João Gestor", username: "joao_gestor", email: "joao@stockguardian.com", role: "gestor", ativo: true, criadoEm: "2024-01-20" },
  { id: 5, nome: "Maria Conferente", username: "maria_conf", email: "maria@stockguardian.com", role: "conferente", grupo: "laticinios", ativo: true, criadoEm: "2024-04-01" },
  { id: 6, nome: "Pedro Repositor", username: "pedro_rep", email: "pedro@stockguardian.com", role: "repositor", grupo: "secos", ativo: true, criadoEm: "2024-05-10" },
];

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export const mockProducts: Product[] = realProducts as unknown as Product[];

export const mockInitialLots: Lot[] = [];

export const mockInitialReposicoes: ReposicaoRecord[] = [];

export const mockInitialNotifications: Notification[] = [];

export const mockAuditLogs: AuditLog[] = [];

export const mockProductsExternal: Record<string, { nome: string; preco: number; categoria: string }> = {
  "7891000100103": { nome: "Leite Integral 1L", preco: 4.99, categoria: "Laticínios" },
  "7891000315507": { nome: "Iogurte Natural 170g", preco: 2.49, categoria: "Laticínios" },
  "7891234567890": { nome: "Pão de Forma Integral", preco: 8.99, categoria: "Padaria" },
  "7890000000123": { nome: "Queijo Minas Padrão 500g", preco: 14.99, categoria: "Laticínios" },
  "7891150022688": { nome: "Refrigerante Cola 2L", preco: 7.49, categoria: "Bebidas" },
};

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
