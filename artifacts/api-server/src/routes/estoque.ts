import { Router } from "express";
import { neon } from "@neondatabase/serverless";

const router = Router();

const NEON_URL = process.env.VITE_NEON_URL || process.env.NEON_URL;

function getSQL() {
  if (!NEON_URL) return null;
  return neon(NEON_URL);
}

router.post("/estoque", async (req, res) => {
  const sql = getSQL();
  if (!sql) return res.status(503).json({ error: "Banco de dados não configurado" });

  const { produto_id, quantidade, validade, lote, custo, preco_venda, origem } = req.body;

  if (!produto_id || !quantidade || !validade) {
    return res.status(400).json({ error: "produto_id, quantidade e validade são obrigatórios" });
  }

  const qtd = Number(quantidade);
  if (isNaN(qtd) || qtd <= 0) {
    return res.status(400).json({ error: "quantidade deve ser um número positivo" });
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(validade)) {
    return res.status(400).json({ error: "validade deve estar no formato YYYY-MM-DD" });
  }

  try {
    await sql`
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
        lote TEXT
      )
    `;

    const produto = await sql`
      SELECT id, nome, codigo_barras, preco, custo FROM sg_products WHERE id = ${Number(produto_id)} LIMIT 1
    `;

    if (produto.length === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    const prod = produto[0];
    const id = `lot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const dataRecebimento = new Date().toISOString().split("T")[0];
    const custoFinal = custo != null ? Number(custo) : Number(prod.custo);
    const precoFinal = preco_venda != null ? Number(preco_venda) : Number(prod.preco);

    await sql`
      INSERT INTO sg_lots (id, produto_codigo, produto_nome, quantidade, validade, custo, preco_venda, data_recebimento, origem, lote)
      VALUES (
        ${id},
        ${String(prod.codigo_barras)},
        ${String(prod.nome)},
        ${qtd},
        ${validade},
        ${custoFinal},
        ${precoFinal},
        ${dataRecebimento},
        ${origem || "manual"},
        ${lote || null}
      )
    `;

    return res.status(201).json({
      id,
      produto_id: prod.id,
      produto_codigo: prod.codigo_barras,
      produto_nome: prod.nome,
      quantidade: qtd,
      validade,
      custo: custoFinal,
      preco_venda: precoFinal,
      data_recebimento: dataRecebimento,
      origem: origem || "manual",
      lote: lote || null,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message ?? "Erro ao registrar estoque" });
  }
});

router.get("/estoque", async (req, res) => {
  const sql = getSQL();
  if (!sql) return res.status(503).json({ error: "Banco de dados não configurado" });

  const hoje = new Date().toISOString().split("T")[0];

  try {
    await sql`
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
        lote TEXT
      )
    `;

    const rows = await sql`
      SELECT
        id,
        produto_codigo as "produtoCodigo",
        produto_nome as "produtoNome",
        quantidade,
        validade,
        custo,
        preco_venda as "precoVenda",
        data_recebimento as "dataRecebimento",
        origem,
        lote,
        CASE
          WHEN validade < ${hoje} THEN 'vencido'
          WHEN validade <= ${new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]} THEN 'critico'
          WHEN validade <= ${new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]} THEN 'atencao'
          ELSE 'ok'
        END as status,
        (validade::date - CURRENT_DATE)::int as dias_restantes
      FROM sg_lots
      WHERE quantidade > 0
      ORDER BY validade ASC
    `;

    return res.json({ lotes: rows, total: rows.length });
  } catch (e: any) {
    return res.status(500).json({ error: e.message ?? "Erro ao buscar estoque" });
  }
});

export default router;
