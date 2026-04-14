import { neon } from "@neondatabase/serverless";
import { Lot, ReposicaoRecord, Notification } from "@/services/mockData";

const NEON_URL = import.meta.env.VITE_NEON_URL as string | undefined;

let sql: ReturnType<typeof neon> | null = null;

function getSQL() {
  if (!NEON_URL) return null;
  if (!sql) sql = neon(NEON_URL);
  return sql;
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
