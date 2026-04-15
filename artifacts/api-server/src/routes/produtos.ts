import { Router } from "express";
import { neon } from "@neondatabase/serverless";

const router = Router();

const NEON_URL = process.env.VITE_NEON_URL || process.env.NEON_URL;

function getSQL() {
  if (!NEON_URL) return null;
  return neon(NEON_URL);
}

router.get("/produtos", async (req, res) => {
  const sql = getSQL();
  if (!sql) {
    return res.status(503).json({ error: "Banco de dados não configurado" });
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  const offset = (page - 1) * limit;
  const search = String(req.query.search || "").trim();
  const categoria = String(req.query.categoria || "").trim();

  try {
    let rows: any[];
    let countRows: any[];

    if (search && categoria) {
      rows = await sql`
        SELECT id, nome, codigo_barras as "codigoBarras", preco, custo, validade, categoria, quantidade
        FROM sg_products
        WHERE (nome ILIKE ${"%" + search + "%"} OR codigo_barras ILIKE ${"%" + search + "%"})
          AND categoria = ${categoria}
        ORDER BY nome
        LIMIT ${limit} OFFSET ${offset}
      `;
      countRows = await sql`
        SELECT COUNT(*)::int AS cnt FROM sg_products
        WHERE (nome ILIKE ${"%" + search + "%"} OR codigo_barras ILIKE ${"%" + search + "%"})
          AND categoria = ${categoria}
      `;
    } else if (search) {
      rows = await sql`
        SELECT id, nome, codigo_barras as "codigoBarras", preco, custo, validade, categoria, quantidade
        FROM sg_products
        WHERE nome ILIKE ${"%" + search + "%"} OR codigo_barras ILIKE ${"%" + search + "%"}
        ORDER BY nome
        LIMIT ${limit} OFFSET ${offset}
      `;
      countRows = await sql`
        SELECT COUNT(*)::int AS cnt FROM sg_products
        WHERE nome ILIKE ${"%" + search + "%"} OR codigo_barras ILIKE ${"%" + search + "%"}
      `;
    } else if (categoria) {
      rows = await sql`
        SELECT id, nome, codigo_barras as "codigoBarras", preco, custo, validade, categoria, quantidade
        FROM sg_products
        WHERE categoria = ${categoria}
        ORDER BY nome
        LIMIT ${limit} OFFSET ${offset}
      `;
      countRows = await sql`SELECT COUNT(*)::int AS cnt FROM sg_products WHERE categoria = ${categoria}`;
    } else {
      rows = await sql`
        SELECT id, nome, codigo_barras as "codigoBarras", preco, custo, validade, categoria, quantidade
        FROM sg_products
        ORDER BY nome
        LIMIT ${limit} OFFSET ${offset}
      `;
      countRows = await sql`SELECT COUNT(*)::int AS cnt FROM sg_products`;
    }

    const total = Number(countRows[0]?.cnt ?? 0);
    return res.json({
      produtos: rows,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message ?? "Erro ao consultar produtos" });
  }
});

router.get("/produtos/:codigo", async (req, res) => {
  const sql = getSQL();
  if (!sql) return res.status(503).json({ error: "Banco de dados não configurado" });

  try {
    const rows = await sql`
      SELECT id, nome, codigo_barras as "codigoBarras", preco, custo, validade, categoria, quantidade
      FROM sg_products
      WHERE codigo_barras = ${req.params.codigo}
      LIMIT 1
    `;
    if (rows.length === 0) return res.status(404).json({ error: "Produto não encontrado" });
    return res.json(rows[0]);
  } catch (e: any) {
    return res.status(500).json({ error: e.message ?? "Erro ao buscar produto" });
  }
});

export default router;
