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
  login: string,
  senha: string
): Promise<{ token: string; user: { id: number; nome: string; email: string; role: string } }> {
  await delay(800);

  const usuarios: Array<{ id: number; nome: string; username: string; email: string; role: string; senha: string }> = [
    { id: 1, nome: "Alex Sousa", username: "Alex_Sousa", email: "alex@stockguardian.com", role: "admin", senha: "12345" },
    { id: 2, nome: "Carlos Operador", username: "carlos", email: "carlos@stockguardian.com", role: "operador", senha: "carlos123" },
    { id: 3, nome: "Fernanda Viewer", username: "fernanda", email: "fernanda@stockguardian.com", role: "viewer", senha: "fernanda123" },
  ];

  const loginLower = login.trim().toLowerCase();
  const usuario = usuarios.find(
    (u) => u.email.toLowerCase() === loginLower || u.username.toLowerCase() === loginLower
  );

  if (!usuario || usuario.senha !== senha) {
    throw new Error("Usuário ou senha inválidos");
  }

  const token = btoa(`${usuario.email}:${Date.now()}:${Math.random()}`);
  return {
    token,
    user: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
    },
  };
}
