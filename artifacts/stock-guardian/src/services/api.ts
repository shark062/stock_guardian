import { mockProductsExternal } from "./mockData";

const getToken = () => localStorage.getItem("sg_token");

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  await delay(200);
  throw new Error(`Endpoint ${endpoint} não encontrado`);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function consultarProdutoExterno(
  codigo: string
): Promise<{ encontrado: boolean; dados?: Partial<{ nome: string; preco: number; categoria: string }> }> {
  await delay(600);
  const dados = mockProductsExternal[codigo];
  if (dados) {
    return { encontrado: true, dados };
  }
  return { encontrado: false };
}

export async function simularLogin(
  email: string,
  senha: string
): Promise<{ token: string; user: { id: number; nome: string; email: string; role: string } }> {
  await delay(800);

  const usuarios: Record<string, { id: number; nome: string; role: string; senha: string }> = {
    "admin@stockguardian.com": { id: 1, nome: "Admin Master", role: "admin", senha: "admin123" },
    "carlos@stockguardian.com": { id: 2, nome: "Carlos Operador", role: "operador", senha: "carlos123" },
    "fernanda@stockguardian.com": { id: 3, nome: "Fernanda Viewer", role: "viewer", senha: "fernanda123" },
  };

  const usuario = usuarios[email];
  if (!usuario || usuario.senha !== senha) {
    throw new Error("Email ou senha inválidos");
  }

  const token = btoa(`${email}:${Date.now()}:${Math.random()}`);
  return {
    token,
    user: {
      id: usuario.id,
      nome: usuario.nome,
      email,
      role: usuario.role,
    },
  };
}
