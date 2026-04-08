export interface ProdutoRecebido {
  nome: string;
  codigoBarras: string;
  quantidade: number;
  validade: string;
  custo: number;
  preco_venda: number;
}

function addDays(base: string, days: number): string {
  const d = new Date(base + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function futureDateFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const PRODUTOS_SIMULADOS: ProdutoRecebido[] = [
  {
    nome: "Leite Desnatado 1L",
    codigoBarras: "7891000315521",
    quantidade: 48,
    validade: futureDateFromNow(20),
    custo: 2.90,
    preco_venda: 4.49,
  },
  {
    nome: "Requeijão Cremoso 200g",
    codigoBarras: "7891000100201",
    quantidade: 24,
    validade: futureDateFromNow(45),
    custo: 5.20,
    preco_venda: 7.90,
  },
  {
    nome: "Manteiga com Sal 200g",
    codigoBarras: "7891000100228",
    quantidade: 36,
    validade: futureDateFromNow(60),
    custo: 6.80,
    preco_venda: 9.99,
  },
  {
    nome: "Achocolatado 200ml",
    codigoBarras: "7891000100235",
    quantidade: 60,
    validade: futureDateFromNow(90),
    custo: 1.50,
    preco_venda: 2.49,
  },
  {
    nome: "Cream Cheese 150g",
    codigoBarras: "7891000100242",
    quantidade: 18,
    validade: futureDateFromNow(30),
    custo: 7.40,
    preco_venda: 11.90,
  },
];

let ultimaSincronizacao: string | null = null;

export async function buscarProdutosRecebidos(): Promise<ProdutoRecebido[]> {
  await new Promise((r) => setTimeout(r, 1200));

  const quantidade = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...PRODUTOS_SIMULADOS].sort(() => Math.random() - 0.5);
  const resultado = shuffled.slice(0, quantidade).map((p) => ({
    ...p,
    quantidade: Math.floor(Math.random() * 50) + 12,
    validade: futureDateFromNow(Math.floor(Math.random() * 60) + 10),
  }));

  ultimaSincronizacao = new Date().toISOString();
  return resultado;
}

export function getUltimaSincronizacao(): string | null {
  return ultimaSincronizacao;
}

export function findProductByBarcode(codigo: string): Omit<ProdutoRecebido, "quantidade" | "validade"> | null {
  const todos = PRODUTOS_SIMULADOS.concat([
    { nome: "Leite Integral 1L", codigoBarras: "7891000315507", quantidade: 0, validade: "", custo: 3.20, preco_venda: 4.99 },
    { nome: "Pão de Forma Integral", codigoBarras: "7896019908027", quantidade: 0, validade: "", custo: 5.50, preco_venda: 8.50 },
    { nome: "Iogurte Natural 400g", codigoBarras: "7891000100103", quantidade: 0, validade: "", custo: 2.40, preco_venda: 3.75 },
    { nome: "Suco de Laranja 1L", codigoBarras: "7896010302312", quantidade: 0, validade: "", custo: 4.30, preco_venda: 6.90 },
    { nome: "Biscoito Cream Cracker", codigoBarras: "7896003706813", quantidade: 0, validade: "", custo: 1.80, preco_venda: 2.99 },
    { nome: "Arroz Agulhinha 5kg", codigoBarras: "7896006760909", quantidade: 0, validade: "", custo: 17.50, preco_venda: 24.90 },
    { nome: "Feijão Carioca 1kg", codigoBarras: "7891012025403", quantidade: 0, validade: "", custo: 5.20, preco_venda: 7.80 },
    { nome: "Azeite Extra Virgem 500ml", codigoBarras: "5601006006100", quantidade: 0, validade: "", custo: 19.80, preco_venda: 28.50 },
    { nome: "Macarrão Espaguete 500g", codigoBarras: "7891000239628", quantidade: 0, validade: "", custo: 2.10, preco_venda: 3.49 },
    { nome: "Queijo Mussarela 500g", codigoBarras: "7891000100141", quantidade: 0, validade: "", custo: 9.80, preco_venda: 14.90 },
    { nome: "Frango Inteiro Kg", codigoBarras: "7896179200042", quantidade: 0, validade: "", custo: 12.50, preco_venda: 18.90 },
    { nome: "Chocolate ao Leite 90g", codigoBarras: "7622300951023", quantidade: 0, validade: "", custo: 2.80, preco_venda: 4.50 },
    { nome: "Café Torrado 500g", codigoBarras: "7896197804805", quantidade: 0, validade: "", custo: 9.00, preco_venda: 14.50 },
    { nome: "Margarina 500g", codigoBarras: "7891000100325", quantidade: 0, validade: "", custo: 3.70, preco_venda: 5.90 },
  ]);
  const found = todos.find((p) => p.codigoBarras === codigo);
  if (!found) return null;
  const { quantidade, validade, ...rest } = found;
  return rest;
}
