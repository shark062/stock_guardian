import { neon } from "@neondatabase/serverless";
import { Lot, ReposicaoRecord, Notification } from "@/services/mockData";

const NEON_URL = import.meta.env.VITE_NEON_URL as string | undefined;

let sql: ReturnType<typeof neon> | null = null;

function getSQL() {
  if (!NEON_URL) return null;
  if (!sql) sql = neon(NEON_URL);
  return sql;
}

export interface NeonProduct {
  id: number;
  nome: string;
  codigoBarras: string;
  preco: number;
  custo: number;
  validade: string;
  categoria: string;
  quantidade: number;
}

export async function ensureProductsTable(): Promise<void> {
  const db = getSQL();
  if (!db) return;
  try {
    await db`
      CREATE TABLE IF NOT EXISTS sg_products (
        id INTEGER PRIMARY KEY,
        nome TEXT NOT NULL,
        codigo_barras TEXT NOT NULL,
        preco NUMERIC(10,2) NOT NULL DEFAULT 0,
        custo NUMERIC(10,2) NOT NULL DEFAULT 0,
        validade TEXT NOT NULL DEFAULT '2099-12-31',
        categoria TEXT NOT NULL DEFAULT 'Outros',
        quantidade INTEGER NOT NULL DEFAULT 0
      )
    `;
  } catch (e) {
    console.error("[neonDB] Erro ao criar tabela sg_products:", e);
  }
}

export async function countProducts(): Promise<number> {
  const db = getSQL();
  if (!db) return 0;
  try {
    const rows = await db`SELECT COUNT(*)::int AS cnt FROM sg_products`;
    return Number(rows[0]?.cnt ?? 0);
  } catch {
    return 0;
  }
}

export async function loadProductsFromNeon(): Promise<NeonProduct[]> {
  const db = getSQL();
  if (!db) return [];
  try {
    const rows = await db`SELECT * FROM sg_products ORDER BY id`;
    return rows.map((r) => ({
      id: Number(r.id),
      nome: r.nome as string,
      codigoBarras: r.codigo_barras as string,
      preco: Number(r.preco),
      custo: Number(r.custo),
      validade: r.validade as string,
      categoria: r.categoria as string,
      quantidade: Number(r.quantidade),
    }));
  } catch (e) {
    console.error("[neonDB] Erro ao carregar produtos:", e);
    return [];
  }
}

export async function seedProductsToNeon(products: NeonProduct[]): Promise<void> {
  const db = getSQL();
  if (!db) return;
  const PARALLEL = 40;
  try {
    for (let i = 0; i < products.length; i += PARALLEL) {
      const batch = products.slice(i, i + PARALLEL);
      await Promise.all(
        batch.map((p) =>
          db!`INSERT INTO sg_products (id, nome, codigo_barras, preco, custo, validade, categoria, quantidade)
              VALUES (${p.id}, ${p.nome}, ${p.codigoBarras}, ${p.preco}, ${p.custo}, ${p.validade}, ${p.categoria}, ${p.quantidade})
              ON CONFLICT (id) DO NOTHING`
        )
      );
    }
  } catch (e) {
    console.error("[neonDB] Erro ao semear produtos:", e);
  }
}

export async function saveCustomProductToNeon(p: NeonProduct): Promise<void> {
  const db = getSQL();
  if (!db) return;
  try {
    await db`
      INSERT INTO sg_products (id, nome, codigo_barras, preco, custo, validade, categoria, quantidade)
      VALUES (${p.id}, ${p.nome}, ${p.codigoBarras}, ${p.preco}, ${p.custo}, ${p.validade}, ${p.categoria}, ${p.quantidade})
      ON CONFLICT (id) DO UPDATE SET
        nome = EXCLUDED.nome, preco = EXCLUDED.preco,
        custo = EXCLUDED.custo, validade = EXCLUDED.validade,
        categoria = EXCLUDED.categoria, quantidade = EXCLUDED.quantidade
    `;
  } catch (e) {
    console.error("[neonDB] Erro ao salvar produto:", e);
  }
}

export async function initDB(): Promise<boolean> {
  const db = getSQL();
  if (!db) return false;
  try {
    await db`
      CREATE TABLE IF NOT EXISTS sg_lots (
        id TEXT PRIMARY KEY,
        produto_codigo TEXT NOT NULL,
        produto_nome TEXT NOT NULL,
        quantidade INTEGER NOT NULL DEFAULT 0,
        validade TEXT NOT NULL,
        custo NUMERIC(10,2) NOT NULL DEFAULT 0,
        preco_venda NUMERIC(10,2) NOT NULL DEFAULT 0,
        data_recebimento TEXT NOT NULL,
        origem TEXT NOT NULL DEFAULT 'manual',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await db`
      CREATE TABLE IF NOT EXISTS sg_reposicoes (
        id TEXT PRIMARY KEY,
        produto_codigo TEXT NOT NULL,
        produto_nome TEXT NOT NULL,
        quantidade INTEGER NOT NULL DEFAULT 0,
        validade TEXT NOT NULL,
        imagem_url TEXT NOT NULL DEFAULT '',
        usuario TEXT NOT NULL,
        usuario_nome TEXT NOT NULL,
        data TEXT NOT NULL,
        erro_fifo BOOLEAN NOT NULL DEFAULT FALSE,
        inconsistencia_imagem BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await db`
      CREATE TABLE IF NOT EXISTS sg_notifications (
        id TEXT PRIMARY KEY,
        tipo TEXT NOT NULL,
        mensagem TEXT NOT NULL,
        destinatario TEXT NOT NULL,
        lida BOOLEAN NOT NULL DEFAULT FALSE,
        data TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await ensureUsersTable();
    return true;
  } catch (e) {
    console.error("[neonDB] Erro ao criar tabelas:", e);
    return false;
  }
}

export async function loadLots(): Promise<Lot[]> {
  const db = getSQL();
  if (!db) return [];
  try {
    const rows = await db`SELECT * FROM sg_lots ORDER BY created_at DESC`;
    return rows.map((r) => ({
      id: r.id as string,
      produtoCodigo: r.produto_codigo as string,
      produtoNome: r.produto_nome as string,
      quantidade: Number(r.quantidade),
      validade: r.validade as string,
      custo: Number(r.custo),
      precoVenda: Number(r.preco_venda),
      dataRecebimento: r.data_recebimento as string,
      origem: r.origem as "manual" | "api",
    }));
  } catch (e) {
    console.error("[neonDB] Erro ao carregar lotes:", e);
    return [];
  }
}

export async function saveLot(lot: Lot): Promise<void> {
  const db = getSQL();
  if (!db) return;
  try {
    await db`
      INSERT INTO sg_lots (id, produto_codigo, produto_nome, quantidade, validade, custo, preco_venda, data_recebimento, origem)
      VALUES (${lot.id}, ${lot.produtoCodigo}, ${lot.produtoNome}, ${lot.quantidade}, ${lot.validade}, ${lot.custo}, ${lot.precoVenda}, ${lot.dataRecebimento}, ${lot.origem})
      ON CONFLICT (id) DO UPDATE SET
        quantidade = EXCLUDED.quantidade,
        custo = EXCLUDED.custo,
        preco_venda = EXCLUDED.preco_venda
    `;
  } catch (e) {
    console.error("[neonDB] Erro ao salvar lote:", e);
  }
}

export async function loadReposicoes(): Promise<ReposicaoRecord[]> {
  const db = getSQL();
  if (!db) return [];
  try {
    const rows = await db`SELECT * FROM sg_reposicoes ORDER BY created_at DESC`;
    return rows.map((r) => ({
      id: r.id as string,
      produtoCodigo: r.produto_codigo as string,
      produtoNome: r.produto_nome as string,
      quantidade: Number(r.quantidade),
      validade: r.validade as string,
      imagemUrl: r.imagem_url as string,
      usuario: r.usuario as string,
      usuarioNome: r.usuario_nome as string,
      data: r.data as string,
      erro_fifo: Boolean(r.erro_fifo),
      inconsistencia_imagem: Boolean(r.inconsistencia_imagem),
    }));
  } catch (e) {
    console.error("[neonDB] Erro ao carregar reposições:", e);
    return [];
  }
}

export async function saveReposicao(record: ReposicaoRecord): Promise<void> {
  const db = getSQL();
  if (!db) return;
  try {
    await db`
      INSERT INTO sg_reposicoes (id, produto_codigo, produto_nome, quantidade, validade, imagem_url, usuario, usuario_nome, data, erro_fifo, inconsistencia_imagem)
      VALUES (${record.id}, ${record.produtoCodigo}, ${record.produtoNome}, ${record.quantidade}, ${record.validade}, ${record.imagemUrl}, ${record.usuario}, ${record.usuarioNome}, ${record.data}, ${record.erro_fifo}, ${record.inconsistencia_imagem})
      ON CONFLICT (id) DO NOTHING
    `;
  } catch (e) {
    console.error("[neonDB] Erro ao salvar reposição:", e);
  }
}

export async function loadNotifications(): Promise<Notification[]> {
  const db = getSQL();
  if (!db) return [];
  try {
    const rows = await db`SELECT * FROM sg_notifications ORDER BY created_at DESC LIMIT 200`;
    return rows.map((r) => ({
      id: r.id as string,
      tipo: r.tipo as Notification["tipo"],
      mensagem: r.mensagem as string,
      destinatario: r.destinatario as Notification["destinatario"],
      lida: Boolean(r.lida),
      data: r.data as string,
    }));
  } catch (e) {
    console.error("[neonDB] Erro ao carregar notificações:", e);
    return [];
  }
}

export async function saveNotification(notif: Notification): Promise<void> {
  const db = getSQL();
  if (!db) return;
  try {
    await db`
      INSERT INTO sg_notifications (id, tipo, mensagem, destinatario, lida, data)
      VALUES (${notif.id}, ${notif.tipo}, ${notif.mensagem}, ${notif.destinatario}, ${notif.lida}, ${notif.data})
      ON CONFLICT (id) DO UPDATE SET lida = EXCLUDED.lida
    `;
  } catch (e) {
    console.error("[neonDB] Erro ao salvar notificação:", e);
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  const db = getSQL();
  if (!db) return;
  try {
    await db`UPDATE sg_notifications SET lida = TRUE WHERE id = ${id}`;
  } catch (e) {
    console.error("[neonDB] Erro ao marcar notificação:", e);
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  const db = getSQL();
  if (!db) return;
  try {
    await db`UPDATE sg_notifications SET lida = TRUE WHERE lida = FALSE`;
  } catch (e) {
    console.error("[neonDB] Erro ao marcar todas notificações:", e);
  }
}

export const dbAvailable = !!NEON_URL;

export type Role = "admin" | "operador" | "viewer" | "gestor" | "conferente" | "repositor";

export interface DbUser {
  id: number;
  nome: string;
  email: string;
  username: string;
  telefone?: string;
  role: Role;
  grupo?: string;
  ativo: boolean;
  criadoEm: string;
  hasPassword: boolean;
  senhaTemp: boolean;
}

const DEFAULT_SEED_USERS = [
  { id: 1, nome: "Administrador", email: "admin@stockguardian.com", username: "admin", role: "admin", grupo: null, senha: "admin123" },
];

export async function ensureUsersTable(): Promise<void> {
  const db = getSQL();
  if (!db) return;
  try {
    await db`
      CREATE TABLE IF NOT EXISTS sg_users (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        telefone TEXT,
        senha TEXT,
        senha_temp BOOLEAN NOT NULL DEFAULT FALSE,
        role TEXT NOT NULL DEFAULT 'viewer',
        grupo TEXT,
        ativo BOOLEAN NOT NULL DEFAULT TRUE,
        criado_em TEXT NOT NULL DEFAULT CURRENT_DATE::TEXT
      )
    `;
    const OLD_EXAMPLE_EMAILS = [
      "carlos@stockguardian.com",
      "fernanda@stockguardian.com",
      "joao@stockguardian.com",
      "maria@stockguardian.com",
      "pedro@stockguardian.com",
    ];
    for (const email of OLD_EXAMPLE_EMAILS) {
      await db`DELETE FROM sg_users WHERE email = ${email}`;
    }

    const cnt = await db`SELECT COUNT(*)::int AS cnt FROM sg_users`;
    if (Number(cnt[0]?.cnt ?? 0) === 0) {
      for (const u of DEFAULT_SEED_USERS) {
        await db`
          INSERT INTO sg_users (id, nome, email, username, role, grupo, ativo, senha, criado_em)
          VALUES (${u.id}, ${u.nome}, ${u.email}, ${u.username}, ${u.role}, ${u.grupo}, TRUE, ${u.senha}, CURRENT_DATE::TEXT)
          ON CONFLICT (email) DO NOTHING
        `;
      }
    }
  } catch (e) {
    console.error("[neonDB] Erro ao criar tabela sg_users:", e);
  }
}

function mapUserRow(r: Record<string, unknown>): DbUser {
  return {
    id: Number(r.id),
    nome: r.nome as string,
    email: r.email as string,
    username: r.username as string,
    telefone: (r.telefone as string) || undefined,
    role: r.role as Role,
    grupo: (r.grupo as string) || undefined,
    ativo: Boolean(r.ativo),
    criadoEm: r.criado_em as string,
    hasPassword: Boolean(r.has_password),
    senhaTemp: Boolean(r.senha_temp),
  };
}

export async function loadUsersFromDB(): Promise<DbUser[]> {
  const db = getSQL();
  if (!db) return [];
  try {
    const rows = await db`
      SELECT id, nome, email, username, telefone, role, grupo, ativo, criado_em,
             (senha IS NOT NULL) AS has_password, senha_temp
      FROM sg_users ORDER BY id
    `;
    return rows.map(mapUserRow);
  } catch (e) {
    console.error("[neonDB] Erro ao carregar usuários:", e);
    return [];
  }
}

export async function saveUserToDB(user: {
  id?: number;
  nome: string;
  email: string;
  username: string;
  telefone?: string;
  role: string;
  grupo?: string;
  ativo: boolean;
}): Promise<DbUser | null> {
  const db = getSQL();
  if (!db) return null;
  try {
    if (user.id) {
      const rows = await db`
        UPDATE sg_users
        SET nome = ${user.nome}, email = ${user.email}, username = ${user.username},
            telefone = ${user.telefone ?? null}, role = ${user.role},
            grupo = ${user.grupo ?? null}, ativo = ${user.ativo}
        WHERE id = ${user.id}
        RETURNING id, nome, email, username, telefone, role, grupo, ativo, criado_em,
                  (senha IS NOT NULL) AS has_password, senha_temp
      `;
      return rows[0] ? mapUserRow(rows[0] as Record<string, unknown>) : null;
    } else {
      const criado_em = new Date().toISOString().split("T")[0];
      const rows = await db`
        INSERT INTO sg_users (nome, email, username, telefone, role, grupo, ativo, criado_em)
        VALUES (${user.nome}, ${user.email}, ${user.username}, ${user.telefone ?? null},
                ${user.role}, ${user.grupo ?? null}, ${user.ativo}, ${criado_em})
        RETURNING id, nome, email, username, telefone, role, grupo, ativo, criado_em,
                  (senha IS NOT NULL) AS has_password, senha_temp
      `;
      return rows[0] ? mapUserRow(rows[0] as Record<string, unknown>) : null;
    }
  } catch (e) {
    console.error("[neonDB] Erro ao salvar usuário:", e);
    return null;
  }
}

export async function deleteUserFromDB(id: number): Promise<void> {
  const db = getSQL();
  if (!db) return;
  try {
    await db`DELETE FROM sg_users WHERE id = ${id}`;
  } catch (e) {
    console.error("[neonDB] Erro ao excluir usuário:", e);
  }
}

export async function setUserPasswordInDB(email: string, senha: string | null, isTemp = false): Promise<void> {
  const db = getSQL();
  if (!db) return;
  try {
    await db`UPDATE sg_users SET senha = ${senha}, senha_temp = ${isTemp} WHERE LOWER(email) = ${email.toLowerCase()}`;
  } catch (e) {
    console.error("[neonDB] Erro ao atualizar senha:", e);
  }
}

export async function checkPasswordInDB(email: string, senha: string): Promise<boolean> {
  const db = getSQL();
  if (!db) return false;
  try {
    const rows = await db`
      SELECT senha FROM sg_users
      WHERE LOWER(email) = ${email.toLowerCase()}
      LIMIT 1
    `;
    if (rows.length === 0) return false;
    return rows[0].senha === senha;
  } catch (e) {
    console.error("[neonDB] Erro ao verificar senha:", e);
    return false;
  }
}

export async function loginUserFromDB(login: string, senha: string): Promise<{
  id: number; nome: string; email: string; role: string; grupo?: string;
} | null> {
  const db = getSQL();
  if (!db) return null;
  try {
    const loginLower = login.trim().toLowerCase();
    const rows = await db`
      SELECT id, nome, email, role, grupo, senha, senha_temp, ativo
      FROM sg_users
      WHERE (LOWER(email) = ${loginLower} OR LOWER(username) = ${loginLower})
        AND ativo = TRUE
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    const u = rows[0];
    if (u.senha === null || u.senha === undefined) return null;
    if (u.senha !== senha) return null;
    if (u.senha_temp) {
      await db`UPDATE sg_users SET senha_temp = FALSE WHERE id = ${u.id}`;
    }
    return {
      id: Number(u.id),
      nome: u.nome as string,
      email: u.email as string,
      role: u.role as string,
      grupo: (u.grupo as string) || undefined,
    };
  } catch (e) {
    console.error("[neonDB] Erro ao fazer login:", e);
    return null;
  }
}
