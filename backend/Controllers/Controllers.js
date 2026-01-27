import { dataBase } from "../DataBase/dataBase.js";
import dotenv from "dotenv";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

dotenv.config();

// Função auxiliar para montar a query de Data/Latest
const buildDateFilter = (tableAlias, start, end, latest) => {
  const where = [];
  const params = [];

  // 1. Aplica filtros de DATA (Início e Fim) sempre que existirem
  if (start) {
    where.push(`${tableAlias}.DATA_ATUALIZACAO >= ?`);
    params.push(`${start} 00:00:00`);
  }
  if (end) {
    where.push(`${tableAlias}.DATA_ATUALIZACAO <= ?`);
    params.push(`${end} 23:59:59`);
  }

  // 2. Se Latest for true, adiciona filtro EXTRA para pegar o MAX de cada mês
  // Isso permite filtrar: "Dentro do periodo X, me dê apenas a última de cada mês"
  if (String(latest).toLowerCase() === "true") {
    where.push(`
      ${tableAlias}.DATA_ATUALIZACAO IN (
        SELECT MAX(DATA_ATUALIZACAO)
        FROM ${tableAlias === 'LP' ? 'LP' : 'PAP'}
        GROUP BY DATE_FORMAT(DATA_ATUALIZACAO, '%Y-%m')
      )
    `);
  }

  return { where, params };
};

export const getLP = async (req, res) => {
  try {
    let { q, start, end, latest, limit = 1000, offset = 0, orderBy = "ID", orderDir = "DESC" } = req.query;

    limit = Math.min(Number(limit) || 1000, 5000);
    offset = Number(offset) || 0;

    const validOrder = ["ID", "DATA_ATUALIZACAO", "LOGIN_NET", "LOGIN_CLARO"];
    orderBy = validOrder.includes(orderBy) ? orderBy : "ID";
    orderDir = orderDir.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const mainFilters = buildDateFilter("LP", start, end, latest);
    const where = mainFilters.where;
    const params = mainFilters.params;

    // --- Search ---
    if (q) {
      const like = `%${q}%`;
      where.push(`
        (LP.CANAL LIKE ? OR LP.COLABORADOR LIKE ? OR LP.LOGIN_CLARO LIKE ? OR
         LP.COMTA LIKE ? OR LP.CABEAMENTO LIKE ? OR LP.LOGIN_NET LIKE ? OR
         LP.LOJA LIKE ? OR LP.CIDADE LIKE ? OR LP.COORDENADOR LIKE ? OR LP.STATUS LIKE ?)
      `);
      params.push(like, like, like, like, like, like, like, like, like, like);
    }

    const sql = `
      SELECT LP.*
      FROM LP
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY LP.${orderBy} ${orderDir}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const [rows] = await dataBase.query(sql, params);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar LP" });
  }
};

export const getPAP = async (req, res) => {
  try {
    let { q, start, end, latest, limit = 2000, offset = 0, orderBy = "ID", orderDir = "DESC" } = req.query;

    limit = Math.min(Number(limit) || 2000, 5000);
    offset = Number(offset) || 0;

    const validOrder = ["ID", "DATA_CADASTRO", "CIDADE", "IBGE", "NOME"];
    orderBy = validOrder.includes(orderBy) ? orderBy : "ID";
    orderDir = orderDir.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const mainFilters = buildDateFilter("PAP", start, end, latest);
    const where = mainFilters.where;
    const params = mainFilters.params;

    if (q) {
      const like = `%${q}%`;
      where.push(`
        (PAP.CANAL LIKE ? OR PAP.IBGE LIKE ? OR PAP.CIDADE LIKE ? OR 
         PAP.RAZAO_SOCIAL LIKE ? OR PAP.CNPJ LIKE ? OR PAP.NOME LIKE ? OR
         PAP.CLASSIFICACAO LIKE ? OR PAP.SEGMENTO LIKE ? OR PAP.PRODUTO_ATUACAO LIKE ?)
      `);
      params.push(like, like, like, like, like, like, like, like, like);
    }

    const sql = `
      SELECT PAP.*
      FROM PAP
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY PAP.${orderBy} ${orderDir}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const [rows] = await dataBase.query(sql, params);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar PAP" });
  }
};