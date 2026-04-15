import { mockProductsExternal } from "./mockData";
import {
  loginUserFromDB,
  setUserPasswordInDB,
  checkPasswordInDB,
  dbAvailable,
} from "./neonDB";

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

export async function createTempPassword(email: string, password: string): Promise<void> {
  await setUserPasswordInDB(email, password, true);
}

export async function setUserPassword(email: string, password: string, isTemp = false): Promise<void> {
  await setUserPasswordInDB(email, password, isTemp);
}

export async function deleteUserPassword(email: string): Promise<void> {
  await setUserPasswordInDB(email, null, false);
}

export async function checkCurrentPassword(email: string, password: string): Promise<boolean> {
  if (!dbAvailable) return false;
  return checkPasswordInDB(email, password);
}

export async function simularLogin(
  login: string,
  senha: string
): Promise<{ token: string; user: { id: number; nome: string; email: string; role: string; grupo?: string } }> {
  if (!dbAvailable) {
    throw new Error("Banco de dados não disponível. Configure VITE_NEON_URL.");
  }

  const result = await loginUserFromDB(login, senha);

  if (!result) {
    throw new Error("Usuário ou senha inválidos");
  }

  const token = btoa(`${result.email}:${Date.now()}:${Math.random()}`);
  return {
    token,
    user: result,
  };
}
