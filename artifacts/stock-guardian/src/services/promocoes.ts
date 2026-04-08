import { Lot } from "./mockData";
import { getDaysToExpire } from "./mockData";

export type NivelPromocao = "urgente" | "baixa" | "leve" | "normal";
export type RiscoPerda = "critico" | "alto" | "moderado" | "ok";

export interface SugestaoPromocao {
  lotId: string;
  produtoNome: string;
  produtoCodigo: string;
  validade: string;
  diasRestantes: number;
  nivel: NivelPromocao;
  custo: number;
  precoOriginal: number;
  margemMinima: number;
  precoSugerido: number;
  descontoPercentual: number;
  riscoPerda: RiscoPerda;
  valorEmRisco: number;
}

const MARGEM_MINIMA_PADRAO = 0.15;

export function calcularMargemMinima(diasRestantes: number): number {
  if (diasRestantes <= 3) return MARGEM_MINIMA_PADRAO;
  if (diasRestantes <= 7) return 0.18;
  if (diasRestantes <= 15) return 0.22;
  return 0.30;
}

export function calcularPrecoMinimo(custo: number, margem: number): number {
  return custo * (1 + margem);
}

export function getNivelPromocao(diasRestantes: number): NivelPromocao {
  if (diasRestantes <= 3) return "urgente";
  if (diasRestantes <= 7) return "baixa";
  if (diasRestantes <= 15) return "leve";
  return "normal";
}

export function getRiscoPerda(diasRestantes: number, quantidade: number): RiscoPerda {
  if (quantidade <= 0) return "ok";
  if (diasRestantes < 0) return "critico";
  if (diasRestantes <= 3) return "critico";
  if (diasRestantes <= 7) return "alto";
  if (diasRestantes <= 15) return "moderado";
  return "ok";
}

export function gerarSugestaoPromocao(lot: Lot): SugestaoPromocao | null {
  const dias = getDaysToExpire(lot.validade);

  if (dias > 15) return null;

  const nivel = getNivelPromocao(dias);
  const margem = calcularMargemMinima(dias);
  const precoSugerido = Math.max(calcularPrecoMinimo(lot.custo, margem), lot.custo * 1.01);
  const desconto = lot.precoVenda > 0 ? ((lot.precoVenda - precoSugerido) / lot.precoVenda) * 100 : 0;
  const riscoPerda = getRiscoPerda(dias, lot.quantidade);
  const valorEmRisco = lot.quantidade * lot.custo;

  return {
    lotId: lot.id,
    produtoNome: lot.produtoNome,
    produtoCodigo: lot.produtoCodigo,
    validade: lot.validade,
    diasRestantes: dias,
    nivel,
    custo: lot.custo,
    precoOriginal: lot.precoVenda,
    margemMinima: margem,
    precoSugerido: Math.round(precoSugerido * 100) / 100,
    descontoPercentual: Math.max(0, Math.round(desconto * 10) / 10),
    riscoPerda,
    valorEmRisco: Math.round(valorEmRisco * 100) / 100,
  };
}

export function gerarTodasSugestoes(lots: Lot[]): SugestaoPromocao[] {
  return lots
    .map(gerarSugestaoPromocao)
    .filter((s): s is SugestaoPromocao => s !== null)
    .sort((a, b) => a.diasRestantes - b.diasRestantes);
}

export function calcularValorTotalEmRisco(sugestoes: SugestaoPromocao[]): number {
  return sugestoes
    .filter((s) => s.riscoPerda === "critico" || s.riscoPerda === "alto")
    .reduce((acc, s) => acc + s.valorEmRisco, 0);
}

export const labelNivel: Record<NivelPromocao, string> = {
  urgente: "Urgente",
  baixa: "Promoção Baixa",
  leve: "Promoção Leve",
  normal: "Normal",
};

export const labelRisco: Record<RiscoPerda, string> = {
  critico: "Crítico",
  alto: "Alto",
  moderado: "Moderado",
  ok: "OK",
};
