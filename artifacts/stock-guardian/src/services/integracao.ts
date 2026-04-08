export interface ProdutoRecebido {
  nome: string;
  codigoBarras: string;
  quantidade: number;
  validade: string;
  custo: number;
  preco_venda: number;
}

export interface ServerConfig {
  ip: string;
  porta: string;
  senha: string;
  ativo: boolean;
}

const CONFIG_KEY = "sg_server_config";

export function getServerConfig(): ServerConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return JSON.parse(raw) as ServerConfig;
  } catch {}
  return { ip: "192.168.2.198", porta: "8559", senha: "12345", ativo: false };
}

export function saveServerConfig(cfg: ServerConfig) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  } catch {}
}

function futureDateFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const PRODUTOS_MOCK: ProdutoRecebido[] = [
  { nome: "Leite Desnatado 1L", codigoBarras: "7891000315521", quantidade: 48, validade: futureDateFromNow(20), custo: 2.90, preco_venda: 4.49 },
  { nome: "Requeijão Cremoso 200g", codigoBarras: "7891000100201", quantidade: 24, validade: futureDateFromNow(45), custo: 5.20, preco_venda: 7.90 },
  { nome: "Manteiga com Sal 200g", codigoBarras: "7891000100228", quantidade: 36, validade: futureDateFromNow(60), custo: 6.80, preco_venda: 9.99 },
  { nome: "Achocolatado 200ml", codigoBarras: "7891000100235", quantidade: 60, validade: futureDateFromNow(90), custo: 1.50, preco_venda: 2.49 },
  { nome: "Cream Cheese 150g", codigoBarras: "7891000100242", quantidade: 18, validade: futureDateFromNow(30), custo: 7.40, preco_venda: 11.90 },
];

function normalizarProduto(item: any): ProdutoRecebido | null {
  try {
    const nome =
      item.nome || item.name || item.descricao || item.description || item.produto || "";
    const codigoBarras =
      item.codigoBarras || item.codigo_barras || item.barcode || item.ean || item.code || "";
    const quantidade =
      Number(item.quantidade || item.qty || item.quantity || item.estoque || 0);
    const validade =
      item.validade || item.expiry || item.expiration || item.vencimento || "";
    const custo =
      Number(item.custo || item.cost || item.preco_custo || item.purchase_price || 0);
    const preco_venda =
      Number(item.preco_venda || item.preco || item.price || item.sale_price || 0);

    if (!nome && !codigoBarras) return null;

    return {
      nome: nome || codigoBarras,
      codigoBarras: String(codigoBarras),
      quantidade: isNaN(quantidade) ? 1 : quantidade,
      validade: validade ? String(validade).slice(0, 10) : futureDateFromNow(30),
      custo: isNaN(custo) ? 0 : custo,
      preco_venda: isNaN(preco_venda) ? 0 : preco_venda,
    };
  } catch {
    return null;
  }
}

export interface SyncResult {
  sucesso: boolean;
  fonte: "servidor" | "mock";
  produtos: ProdutoRecebido[];
  erro?: string;
  statusCode?: number;
}

export async function buscarProdutosRecebidos(): Promise<ProdutoRecebido[]> {
  const result = await sincronizarComServidor();
  return result.produtos;
}

export async function sincronizarComServidor(): Promise<SyncResult> {
  const cfg = getServerConfig();

  if (cfg.ativo && cfg.ip && cfg.porta) {
    const baseUrl = `http://${cfg.ip}:${cfg.porta}`;
    const senhaParam = cfg.senha ? `?senha=${encodeURIComponent(cfg.senha)}&password=${encodeURIComponent(cfg.senha)}&token=${encodeURIComponent(cfg.senha)}` : "";

    const endpoints = [
      `${baseUrl}/api/produtos${senhaParam}`,
      `${baseUrl}/produtos${senhaParam}`,
      `${baseUrl}/api/products${senhaParam}`,
      `${baseUrl}/products${senhaParam}`,
      `${baseUrl}/api/estoque${senhaParam}`,
      `${baseUrl}/estoque${senhaParam}`,
      `${baseUrl}/api/recebimentos${senhaParam}`,
      `${baseUrl}/api/items${senhaParam}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: cfg.senha ? `Bearer ${cfg.senha}` : "",
            "X-Password": cfg.senha || "",
            "X-Token": cfg.senha || "",
          },
          signal: AbortSignal.timeout(4000),
        });

        if (res.ok) {
          const data = await res.json();

          let items: any[] = [];
          if (Array.isArray(data)) {
            items = data;
          } else if (Array.isArray(data?.data)) {
            items = data.data;
          } else if (Array.isArray(data?.produtos)) {
            items = data.produtos;
          } else if (Array.isArray(data?.products)) {
            items = data.products;
          } else if (Array.isArray(data?.items)) {
            items = data.items;
          } else if (Array.isArray(data?.estoque)) {
            items = data.estoque;
          } else if (typeof data === "object" && data !== null) {
            items = [data];
          }

          const produtos = items
            .map(normalizarProduto)
            .filter((p): p is ProdutoRecebido => p !== null);

          if (produtos.length > 0) {
            return { sucesso: true, fonte: "servidor", produtos, statusCode: res.status };
          }

          return {
            sucesso: false,
            fonte: "mock",
            produtos: getMockAleatorio(),
            erro: `Servidor respondeu mas retornou lista vazia (${endpoint})`,
            statusCode: res.status,
          };
        }
      } catch (err: any) {
        if (err?.name === "TimeoutError" || err?.message?.includes("timeout")) {
          continue;
        }
        if (err?.name === "TypeError" && err?.message?.includes("fetch")) {
          break;
        }
      }
    }

    return {
      sucesso: false,
      fonte: "mock",
      produtos: getMockAleatorio(),
      erro: `Não foi possível conectar ao servidor ${baseUrl}. Verifique o IP, porta e se o servidor está ligado.`,
    };
  }

  await new Promise((r) => setTimeout(r, 800));
  return { sucesso: true, fonte: "mock", produtos: getMockAleatorio() };
}

export async function testarConexao(): Promise<{ ok: boolean; mensagem: string; statusCode?: number }> {
  const cfg = getServerConfig();
  if (!cfg.ip || !cfg.porta) {
    return { ok: false, mensagem: "Configure o IP e a porta do servidor antes de testar." };
  }

  const baseUrl = `http://${cfg.ip}:${cfg.porta}`;

  try {
    const res = await fetch(`${baseUrl}/`, {
      signal: AbortSignal.timeout(5000),
    });
    return {
      ok: true,
      mensagem: `Servidor respondeu (HTTP ${res.status}). Verificando endpoints de dados...`,
      statusCode: res.status,
    };
  } catch (err: any) {
    if (err?.name === "TimeoutError") {
      return { ok: false, mensagem: `Tempo limite esgotado — ${baseUrl} não respondeu em 5 segundos.` };
    }
    if (err?.message?.includes("Failed to fetch") || err?.message?.includes("NetworkError")) {
      return { ok: false, mensagem: `Não foi possível alcançar ${baseUrl}. Verifique: IP correto, servidor ligado, mesma rede Wi-Fi.` };
    }
    return { ok: false, mensagem: `Erro: ${err?.message || "desconhecido"}` };
  }
}

function getMockAleatorio(): ProdutoRecebido[] {
  const qtd = Math.floor(Math.random() * 3) + 1;
  return [...PRODUTOS_MOCK]
    .sort(() => Math.random() - 0.5)
    .slice(0, qtd)
    .map((p) => ({
      ...p,
      quantidade: Math.floor(Math.random() * 50) + 12,
      validade: futureDateFromNow(Math.floor(Math.random() * 60) + 10),
    }));
}

export function getUltimaSincronizacao(): string | null {
  return localStorage.getItem("sg_last_sync");
}

export function findProductByBarcode(
  codigo: string
): Omit<ProdutoRecebido, "quantidade" | "validade"> | null {
  const todos: ProdutoRecebido[] = [
    ...PRODUTOS_MOCK,
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
  ];

  const found = todos.find((p) => p.codigoBarras === codigo);
  if (!found) return null;
  const { quantidade, validade, ...rest } = found;
  return rest;
}
