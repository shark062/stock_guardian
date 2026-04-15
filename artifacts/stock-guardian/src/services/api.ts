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

const AUTH_STORE_KEY = "sg_auth_store";

interface AuthEntry {
  password: string | null;
  isTemp: boolean;
}

const defaultCredentials: Record<string, AuthEntry> = {
  "alex@stockguardian.com": { password: "12345", isTemp: false },
  "carlos@stockguardian.com": { password: "carlos123", isTemp: false },
  "fernanda@stockguardian.com": { password: "fernanda123", isTemp: false },
};

function getAuthStore(): Record<string, AuthEntry> {
  try {
    const raw = localStorage.getItem(AUTH_STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { ...defaultCredentials };
}

function saveAuthStore(store: Record<string, AuthEntry>) {
  try {
    localStorage.setItem(AUTH_STORE_KEY, JSON.stringify(store));
  } catch {}
}

export function createTempPassword(email: string, password: string) {
  const store = getAuthStore();
  store[email] = { password, isTemp: true };
  saveAuthStore(store);
}

export function setUserPassword(email: string, password: string, isTemp = false) {
  const store = getAuthStore();
  store[email] = { password, isTemp };
  saveAuthStore(store);
}

export function deleteUserPassword(email: string) {
  const store = getAuthStore();
  store[email] = { password: null, isTemp: false };
  saveAuthStore(store);
}

export function getUserHasPassword(email: string): boolean {
  const store = getAuthStore();
  const entry = store[email] ?? defaultCredentials[email];
  return entry?.password !== null && entry?.password !== undefined;
}

export function checkCurrentPassword(email: string, password: string): boolean {
  const store = getAuthStore();
  const entry = store[email] ?? defaultCredentials[email];
  return entry?.password === password;
}

export async function simularLogin(
  login: string,
  senha: string
): Promise<{ token: string; user: { id: number; nome: string; email: string; role: string } }> {
  await delay(800);

  const usuarios: Array<{ id: number; nome: string; username: string; email: string; role: string }> = [
    { id: 1, nome: "Alex Sousa", username: "Alex_Sousa", email: "alex@stockguardian.com", role: "admin" },
    { id: 2, nome: "Carlos Operador", username: "carlos", email: "carlos@stockguardian.com", role: "operador" },
    { id: 3, nome: "Fernanda Viewer", username: "fernanda", email: "fernanda@stockguardian.com", role: "viewer" },
  ];

  const USERS_KEY = "sg_users_state";
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const storedUsers = JSON.parse(raw);
      for (const u of storedUsers) {
        if (!usuarios.find((x) => x.email === u.email)) {
          usuarios.push({ id: u.id, nome: u.nome, username: u.username || u.email, email: u.email, role: u.role });
        } else {
          const idx = usuarios.findIndex((x) => x.email === u.email);
          if (idx >= 0) {
            usuarios[idx] = { ...usuarios[idx], nome: u.nome, username: u.username || u.username, role: u.role };
          }
        }
      }
    }
  } catch {}

  const loginLower = login.trim().toLowerCase();
  const usuario = usuarios.find(
    (u) => u.email.toLowerCase() === loginLower || u.username.toLowerCase() === loginLower
  );

  if (!usuario) {
    throw new Error("Usuário ou senha inválidos");
  }

  const store = getAuthStore();
  const authEntry = store[usuario.email] ?? defaultCredentials[usuario.email];

  if (!authEntry || authEntry.password === null) {
    throw new Error("Este usuário não tem senha definida. Contate o administrador.");
  }

  if (authEntry.password !== senha) {
    throw new Error("Usuário ou senha inválidos");
  }

  if (authEntry.isTemp) {
    const updatedStore = getAuthStore();
    updatedStore[usuario.email] = { password: authEntry.password, isTemp: false };
    saveAuthStore(updatedStore);
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
