import { dataBase } from "../DataBase/dataBase.js";
import dotenv from "dotenv";
import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

dotenv.config();

// Normaliza para comparar sem acentos/maiúsculas se precisar

const MAPA_TABELAS = {
  AA: "AA",
  LP: "LP",
  PME: "PME",
  PAP: "PAP",
  VAREJO: "VAREJO",
  EXCLUSIVOS: "EXCLUSIVOS",
};

const buildDateFilter = (tableAlias, start, end, latest) => {
  const where = [];
  const params = [];
  const tableName = MAPA_TABELAS[tableAlias];

  if (start) {
    where.push(`${tableAlias}.DATA_ATUALIZACAO >= ?`);
    params.push(`${start} 00:00:00`);
  }
  if (end) {
    where.push(`${tableAlias}.DATA_ATUALIZACAO <= ?`);
    params.push(`${end} 23:59:59`);
  }

  if (String(latest).toLowerCase() === "true") {
    where.push(`
      ${tableAlias}.DATA_ATUALIZACAO IN (
        SELECT MAX(DATA_ATUALIZACAO)
        FROM ${tableName}
        GROUP BY DATE_FORMAT(DATA_ATUALIZACAO, '%Y-%m')
      )
    `);
  }

  return { where, params };
};

export const getLP = async (req, res) => {
  try {
    let {
      q,
      start,
      end,
      latest,
      limit = 200000,
      offset = 0,
      orderBy = "ID",
      orderDir = "DESC",
    } = req.query;

    limit = Math.min(Number(limit) || 1000, 200000);
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
        (
        LP.ANOMES LIKE ?
        OR LP.CANAL LIKE ? 
        OR LP.COLABORADOR LIKE ? 
        OR LP.LOGIN_CLARO LIKE ? 
        OR LP.COMTA LIKE ? 
        OR LP.CABEAMENTO LIKE ? 
        OR LP.LOGIN_NET LIKE ? 
        OR LP.LOJA LIKE ? 
        OR LP.CIDADE LIKE ? 
        OR LP.COORDENADOR LIKE ? 
        OR LP.STATUS LIKE ?
        )
      `);
      params.push(
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
      );
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

export const getPME = async (req, res) => {
  try {
    let {
      q,
      start,
      end,
      latest,
      limit = 200000,
      offset = 0,
      orderBy = "ID",
      orderDir = "DESC",
    } = req.query;

    limit = Math.min(Number(limit) || 1000, 200000);
    offset = Number(offset) || 0;

    const validOrder = ["ID", "DATA_ATUALIZACAO", "LOGIN_NET", "LOGIN_CLARO"];
    orderBy = validOrder.includes(orderBy) ? orderBy : "ID";
    orderDir = orderDir.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const mainFilters = buildDateFilter("PME", start, end, latest);
    const where = mainFilters.where;
    const params = mainFilters.params;

    // --- Search ---
    if (q) {
      const like = `%${q}%`;
      where.push(`
        (
        PME.ANOMES LIKE ?
        OR PME.CPF LIKE ? 
        OR PME.NOME LIKE ? 
        OR PME.INPUT LIKE ? 
        OR PME.LOGIN_NET LIKE ? 
        OR PME.RAZAO_SOCIAL LIKE ? 
        OR PME.SITUACAO LIKE ? 
        OR PME.CELULAR LIKE ? 
        OR PME.EMAIL LIKE ? 
        OR PME.EMAIL_GESTOR LIKE ? 
        OR PME.COD LIKE ? 
        OR PME.COMTA LIKE ?
        OR PME.COORDENADOR LIKE ?
        OR PME.GERENTE LIKE ?
        OR PME.TERRITORIO LIKE ?
        OR PME.REGIONAL LIKE ?
        OR PME.TIME LIKE ?
        )
      `);
      params.push(
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
      );
    }

    const sql = `
      SELECT PME.*
      FROM PME
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY PME.${orderBy} ${orderDir}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const [rows] = await dataBase.query(sql, params);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar PME" });
  }
};

export const getPAP = async (req, res) => {
  try {
    let {
      q,
      start,
      end,
      latest,
      limit = 200000,
      offset = 0,
      orderBy = "ID",
      orderDir = "DESC",
    } = req.query;

    limit = Math.min(Number(limit) || 2000, 200000);
    offset = Number(offset) || 0;

    const validOrder = ["ID", "DATA_CADASTRO", "ESTRUTURA", "IBGE", "NOME"];
    orderBy = validOrder.includes(orderBy) ? orderBy : "ID";
    orderDir = orderDir.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const mainFilters = buildDateFilter("PAP", start, end, latest);
    const where = mainFilters.where;
    const params = mainFilters.params;

    if (q) {
      const like = `%${q}%`;
      where.push(`
  (
    PAP.ANOMES LIKE ?
    OR PAP.CANAL LIKE ?
    OR PAP.ESTRUTURA LIKE ?
    OR PAP.IBGE LIKE ?
    OR PAP.CNPJ LIKE ?
    OR PAP.PARCEIRO_LOJA LIKE ?
    OR PAP.CLASSIFICACAO LIKE ?
    OR PAP.SEGMENTO LIKE ?
    OR PAP.LOGIN_NET LIKE ?
    OR PAP.LOGIN_CLARO LIKE ?
    OR PAP.NOME LIKE ?
    OR PAP.DATA_CADASTRO_VENDEDOR LIKE ?
    OR PAP.SITUACAO LIKE ?
    OR PAP.EXECUTIVO LIKE ?
    OR PAP.FILIAL_COORDENADOR LIKE ?
  )
`);
      params.push(
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
      );
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

export const getExclusivos = async (req, res) => {
  try {
    let {
      q,
      start,
      end,
      latest,
      limit = 200000,
      offset = 0,
      orderBy = "ID",
      orderDir = "DESC",
    } = req.query;

    limit = Math.min(Number(limit) || 2000, 200000);
    offset = Number(offset) || 0;

    const validOrder = ["ID", "REGIONAL", "FUNCIONARIO", "CARGO", "CIDADE"];
    orderBy = validOrder.includes(orderBy) ? orderBy : "ID";
    orderDir = orderDir.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const mainFilters = buildDateFilter("EXCLUSIVOS", start, end, latest);
    const where = mainFilters.where;
    const params = mainFilters.params;

    if (q) {
      const like = `%${q}%`;
      where.push(`
  (
    EXCLUSIVOS.ANOMES LIKE ?
    OR EXCLUSIVOS.REGIONAL LIKE ?
    OR EXCLUSIVOS.MAT_BCC LIKE ?
    OR EXCLUSIVOS.MAT_REVOLUTION LIKE ?
    OR EXCLUSIVOS.FUNCIONARIO LIKE ?
    OR EXCLUSIVOS.CARGO LIKE ?
    OR EXCLUSIVOS.GESTOR_1 LIKE ?
    OR EXCLUSIVOS.GESTOR_2 LIKE ?
    OR EXCLUSIVOS.GESTOR_3 LIKE ?
    OR EXCLUSIVOS.CIDADE LIKE ?
    OR EXCLUSIVOS.STATUS LIKE ?
    OR EXCLUSIVOS.ADMISSAO LIKE ?
    OR EXCLUSIVOS.LOGIN_NET LIKE ?
    OR EXCLUSIVOS.CANAL LIKE ?
    OR EXCLUSIVOS.CHAVE LIKE ?
    OR EXCLUSIVOS.MATRICULA_EXECUTIVO LIKE ?
    OR EXCLUSIVOS.EXECUTIVO LIKE ?
    OR EXCLUSIVOS.FILIAL_COORDENADOR LIKE ?
  )
`);
      params.push(
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
      );
    }

    const sql = `
      SELECT EXCLUSIVOS.*
      FROM EXCLUSIVOS
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY EXCLUSIVOS.${orderBy} ${orderDir}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const [rows] = await dataBase.query(sql, params);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar EXCLUSIVOS" });
  }
};

export const getAA = async (req, res) => {
  try {
    let {
      q,
      start,
      end,
      latest,
      limit = 200000,
      offset = 0,
      orderBy = "ID",
      orderDir = "DESC",
    } = req.query;

    limit = Math.min(Number(limit) || 2000, 200000);
    offset = Number(offset) || 0;

    const validOrder = ["ID", "DATA_CADASTRO", "CIDADE", "IBGE", "NOME"];
    orderBy = validOrder.includes(orderBy) ? orderBy : "ID";
    orderDir = orderDir.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const mainFilters = buildDateFilter("AA", start, end, latest);
    const where = mainFilters.where;
    const params = mainFilters.params;

    if (q) {
      const like = `%${q}%`;
      where.push(`
        (
        AA.ANOMES LIKE ?
        OR AA.CANAL LIKE ? 
        OR AA.IBGE LIKE ? 
        OR AA.CIDADE LIKE ? 
        OR AA.RAZAO_SOCIAL LIKE ? 
        OR AA.PARCEIRO_LOJA LIKE ? 
        OR AA.CNPJ LIKE ? 
        OR AA.NOME LIKE ? 
        OR AA.CLASSIFICACAO LIKE ? 
        OR AA.SEGMENTO LIKE ? 
        OR AA.PRODUTO_ATUACAO LIKE ?
        OR AA.DATA_CADASTRO LIKE ? 
        OR AA.SITUACAO LIKE ? 
        OR AA.LOGIN_NET LIKE ? 
        OR AA.COMTA LIKE ? 
        OR AA.CABEAMENTO LIKE ? 
        OR AA.FILIAL_COORDENADOR LIKE ? 
        OR AA.NM_EQUIPE_VENDA LIKE ? 
        OR AA.GN LIKE ? 
        )
      `);
      params.push(
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
      );
    }

    const sql = `
      SELECT AA.*
      FROM AA
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY AA.${orderBy} ${orderDir}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const [rows] = await dataBase.query(sql, params);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar AA" });
  }
};

export const getVAREJO = async (req, res) => {
  try {
    let {
      q,
      start,
      end,
      latest,
      limit = 200000,
      offset = 0,
      orderBy = "ID",
      orderDir = "DESC",
    } = req.query;

    limit = Math.min(Number(limit) || 2000, 200000);
    offset = Number(offset) || 0;

    const validOrder = ["ID", "DATA_CADASTRO", "CIDADE", "IBGE", "NOME"];
    orderBy = validOrder.includes(orderBy) ? orderBy : "ID";
    orderDir = orderDir.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const mainFilters = buildDateFilter("VAREJO", start, end, latest);
    const where = mainFilters.where;
    const params = mainFilters.params;

    if (q) {
      const like = `%${q}%`;
      where.push(`
        (
        VAREJO.ANOMES LIKE ?
        OR VAREJO.CANAL LIKE ? 
        OR VAREJO.IBGE LIKE ? 
        OR VAREJO.PARCEIRO_LOJA LIKE ? 
        OR VAREJO.CNPJ LIKE ? 
        OR VAREJO.NOME_COLABORADOR LIKE ? 
        OR VAREJO.CARGO LIKE ? 
        OR VAREJO.CPF_COLABORADOR LIKE ? 
        OR VAREJO.PRODUTO_ATUACAO LIKE ?
        OR VAREJO.DATA_CADASTRO LIKE ? 
        OR VAREJO.SITUACAO LIKE ? 
        OR VAREJO.LOGIN_NET LIKE ? 
        OR VAREJO.GN LIKE ? 
        OR VAREJO.COD_PDV LIKE ? 
        OR VAREJO.FILIAL_COORDENADOR LIKE ? 
        )
      `);
      params.push(
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
        like,
      );
    }

    const sql = `
      SELECT VAREJO.*
      FROM VAREJO
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY VAREJO.${orderBy} ${orderDir}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const [rows] = await dataBase.query(sql, params);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar VAREJO" });
  }
};

export const getPDU = async (req, res) => {
  try {
    const { refDate, year, referencia, movel } = req.query; // ex.: ?year=2026&referencia=SP_INT&movel=true

    // --- Filtros dinâmicos apenas no JOIN ---
    const joinFilters = [];
    const joinParams = [];

    // REFERENCIA (normalização + sinônimos + tolerância a acentos/encoding)
    if (referencia) {
      const refMap = {
        BR: "BRASIL",
        BRASIL: "BRASIL",
        SP_INT: "SÃO PAULO INTERIOR",
        "SÃO PAULO INTERIOR": "SÃO PAULO INTERIOR",
        "SAO PAULO INTERIOR": "SÃO PAULO INTERIOR",
        RSI: "SÃO PAULO INTERIOR",
      };
      const key = referencia.toString().toUpperCase().trim();
      const mapped = refMap[key] || referencia;

      if (key === "BR" || key === "BRASIL") {
        joinFilters.push("p.REF_NORM COLLATE utf8mb4_unicode_ci = 'BRASIL'");
      } else if (
        key === "SP_INT" ||
        key === "SÃO PAULO INTERIOR" ||
        key === "SAO PAULO INTERIOR" ||
        key === "RSI"
      ) {
        joinFilters.push(
          "(p.REF_NORM COLLATE utf8mb4_unicode_ci IN ('SÃO PAULO INTERIOR','SAO PAULO INTERIOR'))",
        );
      } else {
        joinFilters.push("p.REF_NORM COLLATE utf8mb4_unicode_ci = UPPER(?)");
        joinParams.push(String(mapped).trim());
      }
    }

    // MOVEL (true/false) -> compara com DECIMAL(18,6); usamos COALESCE no subselect
    let movelFilter = null;
    if (typeof movel !== "undefined") {
      const v = String(movel).trim().toLowerCase();
      const truthy = [
        "1",
        "true",
        "t",
        "sim",
        "s",
        "yes",
        "y",
        "movel",
        "móvel",
        "mobile",
      ];
      const falsy = [
        "0",
        "false",
        "f",
        "nao",
        "não",
        "n",
        "no",
        "fixo",
        "fixed",
      ];
      if (truthy.includes(v)) movelFilter = true;
      else if (falsy.includes(v)) movelFilter = false;
    }
    if (movelFilter !== null) {
      joinFilters.push("ROUND(p.MOVEL, 0) = ?");
      joinParams.push(movelFilter ? 1 : 0);
    }

    const extraOn = joinFilters.length
      ? ` AND ${joinFilters.join(" AND ")}`
      : "";

    // Flags de referência temporal
    const hasRefDate = !!refDate;
    const hasYear = !!year && /^\d{4}$/.test(String(year));

    // Parâmetros para a CTE `params`
    const refParams = [];
    const refDateBaseExpr = hasRefDate
      ? "DATE(?)"
      : hasYear
        ? "STR_TO_DATE(CONCAT(?, '-', DATE_FORMAT(CURDATE(), '%m'), '-01'), '%Y-%m-%d')"
        : "CURDATE()";

    if (hasRefDate) refParams.push(refDate);
    else if (hasYear) refParams.push(String(year));

    // SQL com datas como DATE, parse robusto de DT e somas com 2 casas
    const sql = `
      WITH
      params AS (
        SELECT
          ${refDateBaseExpr} AS ref_date_base,
          CURDATE()          AS today_real
      ),
      bounds AS (
        SELECT
          -- hoje efetivo (âncora)
          CASE
            WHEN ${hasYear ? 1 : 0} = 1 THEN
              LEAST(
                DATE_ADD(ref_date_base, INTERVAL (DAY(CURDATE()) - 1) DAY),
                LAST_DAY(ref_date_base)
              )
            ELSE
              LEAST(ref_date_base, LAST_DAY(ref_date_base))
          END AS today_eff
        FROM params
      ),
      ranges AS (
        SELECT
          -- mês corrente
          DATE_SUB(b.today_eff, INTERVAL DAY(b.today_eff)-1 DAY) AS first_day_cur,
          LAST_DAY(b.today_eff)                                  AS last_day_cur,

          -- mês anterior (baseado em today_eff)
          DATE_SUB(DATE_SUB(b.today_eff, INTERVAL 1 MONTH), INTERVAL DAY(DATE_SUB(b.today_eff, INTERVAL 1 MONTH))-1 DAY) AS first_day_prev,
          LAST_DAY(DATE_SUB(b.today_eff, INTERVAL 1 MONTH))                                                               AS last_day_prev,

          -- próximo mês
          DATE_SUB(DATE_ADD(b.today_eff, INTERVAL 1 MONTH), INTERVAL DAY(DATE_ADD(b.today_eff, INTERVAL 1 MONTH))-1 DAY) AS first_day_next,
          LAST_DAY(DATE_ADD(b.today_eff, INTERVAL 1 MONTH))                                                                AS last_day_next,

          -- mês atual do ano passado
          DATE_SUB(
            DATE_SUB(b.today_eff, INTERVAL 1 YEAR),
            INTERVAL DAY(DATE_SUB(b.today_eff, INTERVAL 1 YEAR))-1 DAY
          ) AS first_day_cur_prev_year,
          LAST_DAY(DATE_SUB(b.today_eff, INTERVAL 1 YEAR)) AS last_day_cur_prev_year,

          b.today_eff
        FROM bounds b
      )
      SELECT
        r.today_eff AS data_referencia,

        DAY(r.last_day_cur) AS dias_no_mes,
        DATEDIFF(r.today_eff, r.first_day_cur) + 1 AS dias_passados,
        GREATEST(DAY(r.last_day_cur) - (DATEDIFF(r.today_eff, r.first_day_cur) + 1), 0) AS dias_restantes,
        CAST(ROUND(100 * (DATEDIFF(r.today_eff, r.first_day_cur) + 1) / DAY(r.last_day_cur), 2) AS DECIMAL(5,2)) AS perc_mes_transcorrido,

        /* SOMAS POR JANELA (prev/cur/next) - 2 casas decimais */
        CAST(ROUND(SUM(CASE WHEN p.DT_DATE BETWEEN r.first_day_cur  AND r.last_day_cur  THEN p.INST ELSE 0 END), 2) AS DECIMAL(18,2)) AS inst_mes_atual,
        CAST(ROUND(SUM(CASE WHEN p.DT_DATE BETWEEN r.first_day_prev AND r.last_day_prev THEN p.INST ELSE 0 END), 2) AS DECIMAL(18,2)) AS inst_mes_anterior,
        CAST(ROUND(SUM(CASE WHEN p.DT_DATE BETWEEN r.first_day_next AND r.last_day_next THEN p.INST ELSE 0 END), 2) AS DECIMAL(18,2)) AS inst_prox_mes,

        CAST(ROUND(SUM(CASE WHEN p.DT_DATE BETWEEN r.first_day_cur  AND r.last_day_cur  THEN p.VB ELSE 0 END), 2) AS DECIMAL(18,2)) AS vb_mes_atual,
        CAST(ROUND(SUM(CASE WHEN p.DT_DATE BETWEEN r.first_day_prev AND r.last_day_prev THEN p.VB ELSE 0 END), 2) AS DECIMAL(18,2)) AS vb_mes_anterior,
        CAST(ROUND(SUM(CASE WHEN p.DT_DATE BETWEEN r.first_day_next AND r.last_day_next THEN p.VB ELSE 0 END), 2) AS DECIMAL(18,2)) AS vb_prox_mes,

        /* Acumulado até hoje */
        CAST(ROUND(SUM(CASE WHEN p.DT_DATE BETWEEN r.first_day_cur AND r.today_eff THEN p.INST ELSE 0 END), 2) AS DECIMAL(18,2)) AS inst_ate_hoje,
        CAST(ROUND(SUM(CASE WHEN p.DT_DATE BETWEEN r.first_day_cur AND r.today_eff THEN p.VB   ELSE 0 END), 2) AS DECIMAL(18,2)) AS vb_ate_hoje,

        /* Mês atual do ano passado */
        CAST(ROUND(SUM(CASE WHEN p.DT_DATE BETWEEN r.first_day_cur_prev_year AND r.last_day_cur_prev_year THEN p.INST ELSE 0 END), 2) AS DECIMAL(18,2)) AS inst_mes_ano_passado,
        CAST(ROUND(SUM(CASE WHEN p.DT_DATE BETWEEN r.first_day_cur_prev_year AND r.last_day_cur_prev_year THEN p.VB   ELSE 0 END), 2) AS DECIMAL(18,2)) AS vb_mes_ano_passado

      FROM ranges r
      LEFT JOIN (
        /* Parse robusto de DT (dd/mm/yyyy OU yyyy-mm-dd) + normalização de referência */
        SELECT
          CASE
            WHEN DT LIKE '__/__/____' THEN STR_TO_DATE(DT, '%d/%m/%Y')
            WHEN DT LIKE '____-__-__' THEN CAST(DT AS DATE)
            ELSE NULL
          END AS DT_DATE,
          CAST(INST AS DECIMAL(18,6)) AS INST,
          CAST(VB   AS DECIMAL(18,6)) AS VB,
          CAST(COALESCE(MOVEL, 0) AS DECIMAL(18,6)) AS MOVEL,
          UPPER(TRIM(REPLACE(REFERENCIA, '\\r', ''))) AS REF_NORM
        FROM pdu
      ) p
        ON (
             (p.DT_DATE BETWEEN r.first_day_prev AND r.last_day_next)
             OR
             (p.DT_DATE BETWEEN r.first_day_cur_prev_year AND r.last_day_cur_prev_year)
           )
        ${extraOn}
      GROUP BY
        r.today_eff, r.first_day_cur, r.last_day_cur,
        r.first_day_prev, r.last_day_prev,
        r.first_day_next, r.last_day_next,
        r.first_day_cur_prev_year, r.last_day_cur_prev_year
    `;

    const [rows] = await dataBase.query(sql, [...refParams, ...joinParams]);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar PDU" });
  }
};

export const getPduFull = async (req, res) => {
  try {
    const { year, referencia } = req.query; // ?year=2026&referencia=SP_INT

    // --- Normaliza e valida ---
    const hasYear = !!year && /^\d{4}$/.test(String(year));
    const refKey = (referencia || "").toString().toUpperCase().trim();

    // Mapa de preferências do front → valores salvos no banco (normalizados)
    // OBS: aqui já mapeamos para 'SÃO PAULO INTERIOR' com acento,
    // mas no SQL usaremos REGEXP para aceitar SÃO/SAO/S?O igualmente.
    const REF_MAP = {
      BR: "BRASIL",
      BRASIL: "BRASIL",
      SP_INT: "SÃO PAULO INTERIOR",
      "SÃO PAULO INTERIOR": "SÃO PAULO INTERIOR",
      "SAO PAULO INTERIOR": "SÃO PAULO INTERIOR",
      RSI: "SÃO PAULO INTERIOR",
    };

    const mappedRef = REF_MAP[refKey]; // undefined se não mapeado

    // Construção dinâmica dos filtros (aplicados sobre campos derivados)
    const params = [];
    const where = [];

    if (hasYear) {
      // Filtra pelo ano derivado de ANOMES (AAAA_NUM)
      where.push(`p.AAAA_NUM = ?`);
      params.push(Number(year));
    }

    let onlyOneRef = false;
    if (mappedRef) {
      onlyOneRef = true;
      if (mappedRef === "BRASIL") {
        where.push(`p.REF_NORM = 'BRASIL'`);
      } else {
        // SP_INT / SÃO PAULO INTERIOR (tolera SÃO/SAO)
        where.push(`p.REF_NORM REGEXP ?`);
        params.push(`^S.?O PAULO INTERIOR$`);
      }
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Subselect que normaliza os campos uma única vez
    const baseSubselect = `
      SELECT
        /* Remove '-' e '/' e transforma em número YYYYMM */
        CAST(REPLACE(REPLACE(anomes, '-', ''), '/', '') AS UNSIGNED)           AS ANOMES_NUM,
        CAST(SUBSTR(REPLACE(REPLACE(anomes, '-', ''), '/', ''), 1, 4) AS UNSIGNED) AS AAAA_NUM,
        UPPER(TRIM(REPLACE(REFERENCIA, '\\r', '')))                             AS REF_NORM,
        VB,
        INST
      FROM pdu
    `;

    const selectSql = onlyOneRef
      ? `
        SELECT
          p.ANOMES_NUM AS anomes,
          SUM(p.VB)   AS VB_soma,
          SUM(p.INST) AS INST_soma
        FROM (${baseSubselect}) p
        ${whereSql}
        GROUP BY p.ANOMES_NUM
        ORDER BY p.ANOMES_NUM
      `
      : `
        SELECT
          p.ANOMES_NUM AS anomes,
          SUM(CASE WHEN p.REF_NORM = 'BRASIL' THEN p.VB ELSE 0 END)                      AS VB_soma_br,
          SUM(CASE WHEN p.REF_NORM REGEXP '^S.?O PAULO INTERIOR$' THEN p.VB ELSE 0 END)  AS VB_soma_RSI,
          SUM(CASE WHEN p.REF_NORM = 'BRASIL' THEN p.INST ELSE 0 END)                     AS INST_soma_br,
          SUM(CASE WHEN p.REF_NORM REGEXP '^S.?O PAULO INTERIOR$' THEN p.INST ELSE 0 END) AS INST_soma_RSI
        FROM (${baseSubselect}) p
        ${whereSql}
        GROUP BY p.ANOMES_NUM
        ORDER BY p.ANOMES_NUM
      `;

    const [rows] = await dataBase.query(selectSql, params);

    // Esqueleto (12 meses) quando year for informado – agora com chave numérica certa (YYYYMM)
    if (hasYear) {
      const skeleton = Array.from({ length: 12 }, (_, i) => {
        const mes = String(i + 1).padStart(2, "0");
        return Number(`${year}${mes}`); // YYYYMM (number)
      });

      const byKey = new Map(rows.map((r) => [Number(r.anomes), r]));
      const completed = skeleton.map((anomes) => {
        const base = byKey.get(anomes);
        if (base) return base;

        return onlyOneRef
          ? { anomes, VB_soma: 0, INST_soma: 0 }
          : {
              anomes,
              VB_soma_br: 0,
              VB_soma_RSI: 0,
              INST_soma_br: 0,
              INST_soma_RSI: 0,
            };
      });

      return res.status(200).json(completed);
    }

    // Sem esqueleto (retorna como veio do banco)
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar FULLBASE" });
  }
};

export const getPDUMovel = async (req, res) => {
  try {
    const { refDate, year } = req.query;

    // --- Flags de data ---
    const hasRefDate = !!refDate;
    const hasYear = !!year && /^\d{4}$/.test(String(year));

    // Parâmetros para a CTE `params`
    const refParams = [];
    const refDateBaseExpr = hasRefDate
      ? "DATE(?)"
      : hasYear
        ? "STR_TO_DATE(CONCAT(?, '-', DATE_FORMAT(CURDATE(), '%m'), '-01'), '%Y-%m-%d')"
        : "CURDATE()";

    if (hasRefDate) refParams.push(refDate);
    else if (hasYear) refParams.push(String(year));

    const sql = `
      WITH
      params AS (
        SELECT
          ${refDateBaseExpr} AS ref_date_base,
          CURDATE()          AS today_real
      ),
      bounds AS (
        SELECT
          CASE
            WHEN ${hasYear ? 1 : 0} = 1 THEN
              LEAST(
                DATE_ADD(ref_date_base, INTERVAL (DAY(CURDATE()) - 1) DAY),
                LAST_DAY(ref_date_base)
              )
            ELSE
              LEAST(ref_date_base, LAST_DAY(ref_date_base))
          END AS today_eff
        FROM params
      ),
      ranges AS (
        SELECT
          DATE_SUB(b.today_eff, INTERVAL DAY(b.today_eff)-1 DAY) AS first_day_cur,
          LAST_DAY(b.today_eff)                                  AS last_day_cur,

          DATE_SUB(DATE_SUB(b.today_eff, INTERVAL 1 MONTH), INTERVAL DAY(DATE_SUB(b.today_eff, INTERVAL 1 MONTH))-1 DAY) AS first_day_prev,
          LAST_DAY(DATE_SUB(b.today_eff, INTERVAL 1 MONTH))                                                               AS last_day_prev,

          DATE_SUB(DATE_ADD(b.today_eff, INTERVAL 1 MONTH), INTERVAL DAY(DATE_ADD(b.today_eff, INTERVAL 1 MONTH))-1 DAY) AS first_day_next,
          LAST_DAY(DATE_ADD(b.today_eff, INTERVAL 1 MONTH))                                                                AS last_day_next,

          DATE_SUB(
            DATE_SUB(b.today_eff, INTERVAL 1 YEAR),
            INTERVAL DAY(DATE_SUB(b.today_eff, INTERVAL 1 YEAR))-1 DAY
          ) AS first_day_cur_prev_year,
          LAST_DAY(DATE_SUB(b.today_eff, INTERVAL 1 YEAR)) AS last_day_cur_prev_year,

          b.today_eff
        FROM bounds b
      )
      SELECT
        r.today_eff AS data_referencia,

        DAY(r.last_day_cur) AS dias_no_mes,
        DATEDIFF(r.today_eff, r.first_day_cur) + 1 AS dias_passados,
        GREATEST(DAY(r.last_day_cur) - (DATEDIFF(r.today_eff, r.first_day_cur) + 1), 0) AS dias_restantes,
        CAST(ROUND(100 * (DATEDIFF(r.today_eff, r.first_day_cur) + 1) / DAY(r.last_day_cur), 2) AS DECIMAL(5,2)) AS perc_mes_transcorrido,

        /* ------------------------------------------------------------------
           MAPEAMENTO:
           inst_... = BRASIL (Soma de MOVEL)
           vb_...   = SPI    (Soma de MOVEL)
           ------------------------------------------------------------------ */

        /* --- MÊS ATUAL --- */
        CAST(ROUND(SUM(CASE 
            WHEN p.DT_DATE BETWEEN r.first_day_cur AND r.last_day_cur 
             AND p.REF_IS_BR = 1
            THEN p.MOVEL ELSE 0 
        END), 2) AS DECIMAL(18,2)) AS inst_mes_atual,  -- BRASIL (móvel)

        CAST(ROUND(SUM(CASE 
            WHEN p.DT_DATE BETWEEN r.first_day_cur AND r.last_day_cur 
             AND p.REF_IS_SPI = 1
            THEN p.MOVEL ELSE 0 
        END), 2) AS DECIMAL(18,2)) AS vb_mes_atual,    -- SPI (móvel)

        /* --- MÊS ANTERIOR --- */
        CAST(ROUND(SUM(CASE 
            WHEN p.DT_DATE BETWEEN r.first_day_prev AND r.last_day_prev 
             AND p.REF_IS_BR = 1
            THEN p.MOVEL ELSE 0 
        END), 2) AS DECIMAL(18,2)) AS inst_mes_anterior,

        CAST(ROUND(SUM(CASE 
            WHEN p.DT_DATE BETWEEN r.first_day_prev AND r.last_day_prev 
             AND p.REF_IS_SPI = 1
            THEN p.MOVEL ELSE 0 
        END), 2) AS DECIMAL(18,2)) AS vb_mes_anterior,

        /* --- PRÓXIMO MÊS --- */
        CAST(ROUND(SUM(CASE 
            WHEN p.DT_DATE BETWEEN r.first_day_next AND r.last_day_next 
             AND p.REF_IS_BR = 1
            THEN p.MOVEL ELSE 0 
        END), 2) AS DECIMAL(18,2)) AS inst_prox_mes,

        CAST(ROUND(SUM(CASE 
            WHEN p.DT_DATE BETWEEN r.first_day_next AND r.last_day_next 
             AND p.REF_IS_SPI = 1
            THEN p.MOVEL ELSE 0 
        END), 2) AS DECIMAL(18,2)) AS vb_prox_mes,

        /* --- ACUMULADO ATÉ HOJE --- */
        CAST(ROUND(SUM(CASE 
            WHEN p.DT_DATE BETWEEN r.first_day_cur AND r.today_eff 
             AND p.REF_IS_BR = 1
            THEN p.MOVEL ELSE 0 
        END), 2) AS DECIMAL(18,2)) AS inst_ate_hoje,

        CAST(ROUND(SUM(CASE 
            WHEN p.DT_DATE BETWEEN r.first_day_cur AND r.today_eff 
             AND p.REF_IS_SPI = 1
            THEN p.MOVEL ELSE 0 
        END), 2) AS DECIMAL(18,2)) AS vb_ate_hoje,

        /* --- MÊS ATUAL DO ANO PASSADO --- */
        CAST(ROUND(SUM(CASE 
            WHEN p.DT_DATE BETWEEN r.first_day_cur_prev_year AND r.last_day_cur_prev_year 
             AND p.REF_IS_BR = 1
            THEN p.MOVEL ELSE 0 
        END), 2) AS DECIMAL(18,2)) AS inst_mes_ano_passado,

        CAST(ROUND(SUM(CASE 
            WHEN p.DT_DATE BETWEEN r.first_day_cur_prev_year AND r.last_day_cur_prev_year 
             AND p.REF_IS_SPI = 1
            THEN p.MOVEL ELSE 0 
        END), 2) AS DECIMAL(18,2)) AS vb_mes_ano_passado

      FROM ranges r
      LEFT JOIN (
        SELECT
          /* Parse robusto de DT (dd/mm/yyyy OU yyyy-mm-dd) */
          CASE
            WHEN DT LIKE '__/__/____' THEN STR_TO_DATE(DT, '%d/%m/%Y')
            WHEN DT LIKE '____-__-__' THEN CAST(DT AS DATE)
            ELSE NULL
          END AS DT_DATE,
          CAST(COALESCE(MOVEL, 0) AS DECIMAL(18,6)) AS MOVEL,
          -- normaliza e cria flags de referência
          CASE WHEN UPPER(TRIM(REPLACE(REFERENCIA, '\\r', ''))) COLLATE utf8mb4_unicode_ci = 'BRASIL' THEN 1 ELSE 0 END AS REF_IS_BR,
          CASE WHEN UPPER(TRIM(REPLACE(REFERENCIA, '\\r', ''))) COLLATE utf8mb4_unicode_ci IN ('SÃO PAULO INTERIOR','SAO PAULO INTERIOR') THEN 1 ELSE 0 END AS REF_IS_SPI
        FROM pdu
      ) p
        ON (
             (
               (p.DT_DATE BETWEEN r.first_day_prev AND r.last_day_next)
               OR
               (p.DT_DATE BETWEEN r.first_day_cur_prev_year AND r.last_day_cur_prev_year)
             )
             AND (p.REF_IS_BR = 1 OR p.REF_IS_SPI = 1)
           )
      GROUP BY
        r.today_eff, r.first_day_cur, r.last_day_cur,
        r.first_day_prev, r.last_day_prev,
        r.first_day_next, r.last_day_next,
        r.first_day_cur_prev_year, r.last_day_cur_prev_year
    `;

    const [rows] = await dataBase.query(sql, refParams);

    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar PDUMovel" });
  }
};

export const getLP_grafico = async (req, res) => {
  try {
    // Aceita ?anomes=202601 ou ?ano=2026&mes=1
    let { anomes, ano, mes } = req.query || {};
    anomes = anomes ? Number(anomes) : undefined;

    if (!anomes && ano && mes) {
      ano = Number(ano);
      mes = Number(mes);
      if (!Number.isNaN(ano) && !Number.isNaN(mes) && mes >= 1 && mes <= 12) {
        anomes = ano * 100 + (mes < 10 ? Number(`0${mes}`) : mes);
      }
    }

    let query = "";
    let params = [];

    if (anomes) {
      // Máximo dentro do mês selecionado
      query = `
        WITH CTE_MAX AS (
          SELECT MAX(DATA_ATUALIZACAO) AS data_maxima
          FROM LP
          WHERE ANOMES = ?
        )
        SELECT
          LP.ANOMES AS anomes,
          LP.COORDENADOR AS coordenador,
          COUNT(DISTINCT LP.COLABORADOR) AS qtde_colaborador_distintas,
          COUNT(DISTINCT LP.LOJA)        AS qtde_lojas_distintas,
          COUNT(DISTINCT LP.CIDADE)      AS qtde_cidades_distintas,
          COUNT(*)                       AS registros
        FROM LP AS LP
        JOIN CTE_MAX AS m
          ON LP.DATA_ATUALIZACAO = m.data_maxima
        WHERE LP.ANOMES = ?
        GROUP BY LP.COORDENADOR, LP.ANOMES
        ORDER BY qtde_lojas_distintas DESC, qtde_cidades_distintas DESC, coordenador;
      `;
      params = [anomes, anomes];
    } else {
      // Snapshot global (sem filtro)
      query = `
        WITH CTE_MAX AS (
          SELECT MAX(DATA_ATUALIZACAO) AS data_maxima
          FROM LP
        )
        SELECT
          LP.ANOMES AS anomes,
          LP.COORDENADOR AS coordenador,
          COUNT(DISTINCT LP.COLABORADOR) AS qtde_colaborador_distintas,
          COUNT(DISTINCT LP.LOJA)        AS qtde_lojas_distintas,
          COUNT(DISTINCT LP.CIDADE)      AS qtde_cidades_distintas,
          COUNT(*)                       AS registros
        FROM LP AS LP
        JOIN CTE_MAX AS m
          ON LP.DATA_ATUALIZACAO = m.data_maxima
        GROUP BY LP.COORDENADOR, LP.ANOMES
        ORDER BY qtde_lojas_distintas DESC, qtde_cidades_distintas DESC, coordenador;
      `;
      params = [];
    }

    const [rows] = await dataBase.query(query, params);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar getLP_grafico" });
  }
};

export const getLP_graficoStatus = async (req, res) => {
  try {
    // Aceita ?anomes=202601 ou ?ano=2026&mes=1
    let { anomes, ano, mes } = req.query || {};
    anomes = anomes ? Number(anomes) : undefined;

    if (!anomes && ano && mes) {
      ano = Number(ano);
      mes = Number(mes);
      if (!Number.isNaN(ano) && !Number.isNaN(mes) && mes >= 1 && mes <= 12) {
        anomes = ano * 100 + (mes < 10 ? Number(`0${mes}`) : mes);
      }
    }

    let query = "";
    let params = [];

    if (anomes) {
      // Máximo dentro do mês selecionado
      query = `
        WITH CTE_MAX AS (
          SELECT MAX(DATA_ATUALIZACAO) AS data_maxima
          FROM LP
          WHERE ANOMES = ?
        )
        SELECT
          LP.ANOMES                     AS anomes,
          LP.STATUS                     AS status,
          COALESCE(NULLIF(TRIM(LP.STATUS), ''), 'SEM STATUS') AS status,
          COUNT(*)              AS QTD      
        FROM LP AS LP
        JOIN CTE_MAX AS m
          ON LP.DATA_ATUALIZACAO = m.data_maxima
        WHERE LP.ANOMES = ?
        GROUP BY LP.STATUS, LP.ANOMES
        ORDER BY STATUS DESC, ANOMES DESC;
      `;
      params = [anomes, anomes];
    } else {
      // Snapshot global (sem filtro)
      query = `
        WITH CTE_MAX AS (
          SELECT MAX(DATA_ATUALIZACAO) AS data_maxima
          FROM LP
        )
        SELECT
          LP.ANOMES                     AS anomes,
          LP.STATUS                     AS status,
          COALESCE(NULLIF(TRIM(LP.STATUS), ''), 'SEM STATUS') AS status,
          COUNT(*)              AS QTD
        FROM LP AS LP
        JOIN CTE_MAX AS m
          ON LP.DATA_ATUALIZACAO = m.data_maxima
        GROUP BY LP.STATUS, LP.ANOMES
        ORDER BY STATUS DESC, ANOMES DESC;
      `;
      params = [];
    }

    const [rows] = await dataBase.query(query, params);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar getLP_grafico" });
  }
};

export const getVAREJO_grafico = async (req, res) => {
  try {
    let { anomes } = req.query;
    let query = "";
    let params = [];

    if (anomes && anomes !== "undefined") {
      const anomesNum = Number(anomes);
      query = `
        WITH CTE_MAX AS (
          SELECT MAX(DATA_ATUALIZACAO) AS data_maxima
          FROM VAREJO
          WHERE ANOMES = ?
        )
        SELECT
          V.anomes,
          V.filial_coordenador, 
          COUNT(DISTINCT V.gn) as gn,
          COUNT(DISTINCT V.ibge) as cidades,
          COUNT(DISTINCT V.parceiro_loja) as loja,
          COUNT(DISTINCT V.cnpj) as parceiro,
          COUNT(DISTINCT V.nome_colaborador) as colaborador,
          COUNT(DISTINCT V.cargo) as cargo,
          COUNT(DISTINCT V.situacao) as situacao
        FROM VAREJO AS V
        JOIN CTE_MAX AS m ON V.data_atualizacao = m.data_maxima
        WHERE V.anomes = ? -- Adicione este filtro aqui também para garantir performance
        GROUP BY V.anomes, V.filial_coordenador
        ORDER BY anomes, filial_coordenador
      `;
      params = [anomesNum, anomesNum]; // Agora sim, dois parâmetros para dois "?"
    } else {
      // Query sem filtro (Snapshot global)
      query = `
        WITH CTE_MAX AS (
          SELECT MAX(DATA_ATUALIZACAO) AS data_maxima
          FROM VAREJO
        )
        SELECT ... -- (mesmos campos)
        FROM VAREJO AS V
        JOIN CTE_MAX AS m ON V.data_atualizacao = m.data_maxima
        GROUP BY V.anomes, V.filial_coordenador
      `;
      params = [];
    }

    const [rows] = await dataBase.query(query, params);
    return res.status(200).json(rows);
  } catch (err) {
    // ... erro
  }
};

export const getVAREJO_graficoHistorico = async (req, res) => {
  try {
    const query = `
      WITH max_por_mes AS (
        SELECT
          ANOMES,
          MAX(DATA_ATUALIZACAO) AS data_maxima_mes
        FROM VAREJO
        GROUP BY ANOMES
      )
      SELECT
        V.anomes,
        V.filial_coordenador,
        count(distinct V.gn) as gn,
        count(distinct V.ibge) as cidades,
        count(distinct V.parceiro_loja) as loja,
        count(distinct V.cnpj) as parceiro,
        count(distinct V.nome_colaborador) as colaborador,
        count(distinct V.cargo) as cargo,
        count(distinct V.situacao) as situacao
      FROM VAREJO V
      JOIN max_por_mes m
        ON V.ANOMES = m.ANOMES
       AND V.DATA_ATUALIZACAO = m.data_maxima_mes
      GROUP BY V.ANOMES, V.filial_coordenador
      ORDER BY V.ANOMES ASC, V.filial_coordenador ASC;
    `;

    const [rows] = await dataBase.query(query);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar histórico VAREJO" });
  }
};

export const getLP_graficoHistorico = async (req, res) => {
  try {
    const query = `
     WITH max_por_mes AS (
  SELECT
    ANOMES,
    MAX(DATA_ATUALIZACAO) AS data_maxima_mes
  FROM LP
  GROUP BY ANOMES
)
SELECT
  LP.ANOMES AS anomes,
  CASE
    WHEN LP.COORDENADOR IS NULL OR LP.COORDENADOR = '' THEN NULL
    ELSE SUBSTRING_INDEX(TRIM(LP.COORDENADOR), ' ', 1)
  END AS coordenador,  -- agora é só o primeiro nome
  COUNT(DISTINCT LP.COLABORADOR) AS qtde_colaborador_distintas,
  COUNT(DISTINCT LP.LOJA)        AS qtde_lojas_distintas,
  COUNT(DISTINCT LP.CIDADE)      AS qtde_cidades_distintas,
  COUNT(*)                       AS registros
FROM LP
JOIN max_por_mes m
  ON LP.ANOMES = m.ANOMES
 AND LP.DATA_ATUALIZACAO = m.data_maxima_mes
GROUP BY
  LP.ANOMES,
  CASE
    WHEN LP.COORDENADOR IS NULL OR LP.COORDENADOR = '' THEN NULL
    ELSE SUBSTRING_INDEX(TRIM(LP.COORDENADOR), ' ', 1)
  END
ORDER BY anomes ASC, coordenador ASC;
    `;

    const [rows] = await dataBase.query(query);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar histórico LP" });
  }
};

export const getPduFullGrafico = async (req, res) => {
  try {
    const { year, referencia } = req.query; // ?year=2026&referencia=SP_INT

    // --- Normaliza e valida ---
    const hasYear = !!year && /^\d{4}$/.test(String(year));
    const refKey = (referencia || "").toString().toUpperCase().trim();

    const REF_MAP = {
      BR: "BRASIL",
      BRASIL: "BRASIL",
      SP_INT: "SÃO PAULO INTERIOR",
      "SÃO PAULO INTERIOR": "SÃO PAULO INTERIOR",
      "SAO PAULO INTERIOR": "SÃO PAULO INTERIOR",
      RSI: "SÃO PAULO INTERIOR",
    };

    const mappedRef = REF_MAP[refKey];

    // Construção dinâmica dos filtros
    const params = [];
    const where = [];

    if (hasYear) {
      where.push(`p.AAAA_NUM = ?`);
      params.push(Number(year));
    }

    let onlyOneRef = false;
    if (mappedRef) {
      onlyOneRef = true;
      if (mappedRef === "BRASIL") {
        where.push(`p.REF_NORM = 'BRASIL'`);
      } else {
        where.push(`p.REF_NORM REGEXP ?`);
        params.push(`^S.?O PAULO INTERIOR$`);
      }
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // 1. ALTERAÇÃO NO SUBSELECT: Incluído campo MOVEL
    const baseSubselect = `
      SELECT
        CAST(REPLACE(REPLACE(anomes, '-', ''), '/', '') AS UNSIGNED)         AS ANOMES_NUM,
        CAST(SUBSTR(REPLACE(REPLACE(anomes, '-', ''), '/', ''), 1, 4) AS UNSIGNED) AS AAAA_NUM,
        UPPER(TRIM(REPLACE(REFERENCIA, '\\r', '')))                         AS REF_NORM,
        VB,
        INST,
        MOVEL  /* <--- Adicionado aqui */
      FROM pdu
    `;

    // 2. ALTERAÇÃO NO SELECT PRINCIPAL: Incluído somas de MOVEL
    const selectSql = onlyOneRef
      ? `
        SELECT
          p.ANOMES_NUM AS anomes,
          SUM(p.VB)    AS VB_soma,
          SUM(p.INST)  AS INST_soma,
          SUM(p.MOVEL) AS MOVEL_soma  /* <--- Soma simples se houver filtro */
        FROM (${baseSubselect}) p
        ${whereSql}
        GROUP BY p.ANOMES_NUM
        ORDER BY p.ANOMES_NUM
      `
      : `
        SELECT
          p.ANOMES_NUM AS anomes,
          /* VB */
          SUM(CASE WHEN p.REF_NORM = 'BRASIL' THEN p.VB ELSE 0 END)                  AS VB_soma_br,
          SUM(CASE WHEN p.REF_NORM REGEXP '^S.?O PAULO INTERIOR$' THEN p.VB ELSE 0 END)  AS VB_soma_RSI,
          
          /* INST */
          SUM(CASE WHEN p.REF_NORM = 'BRASIL' THEN p.INST ELSE 0 END)                 AS INST_soma_br,
          SUM(CASE WHEN p.REF_NORM REGEXP '^S.?O PAULO INTERIOR$' THEN p.INST ELSE 0 END) AS INST_soma_RSI,

          /* MOVEL (Adicionado conforme solicitado) */
          SUM(CASE WHEN p.REF_NORM = 'BRASIL' THEN p.MOVEL ELSE 0 END)                AS MOVEL_soma_br,
          SUM(CASE WHEN p.REF_NORM REGEXP '^S.?O PAULO INTERIOR$' THEN p.MOVEL ELSE 0 END) AS MOVEL_soma_RSI
        FROM (${baseSubselect}) p
        ${whereSql}
        GROUP BY p.ANOMES_NUM
        ORDER BY p.ANOMES_NUM
      `;

    const [rows] = await dataBase.query(selectSql, params);

    // 3. ALTERAÇÃO NO ESQUELETO: Inicializar com 0
    if (hasYear) {
      const skeleton = Array.from({ length: 12 }, (_, i) => {
        const mes = String(i + 1).padStart(2, "0");
        return Number(`${year}${mes}`);
      });

      const byKey = new Map(rows.map((r) => [Number(r.anomes), r]));
      const completed = skeleton.map((anomes) => {
        const base = byKey.get(anomes);
        if (base) return base;

        return onlyOneRef
          ? {
              anomes,
              VB_soma: 0,
              INST_soma: 0,
              MOVEL_soma: 0,
            }
          : {
              anomes,
              VB_soma_br: 0,
              VB_soma_RSI: 0,
              INST_soma_br: 0,
              INST_soma_RSI: 0,
              MOVEL_soma_br: 0, // <--- Inicializa BR
              MOVEL_soma_RSI: 0, // <--- Inicializa RSI
            };
      });

      return res.status(200).json(completed);
    }

    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar FULLBASE" });
  }
};

export const getStatusAtualizacao = async (req, res) => {
  try {
    const query = `SELECT
    'aa' AS tabela,
    MAX(data_atualizacao) AS ultima_data,
    COUNT(*) AS total_registros,
    COUNT(*) / COUNT(DISTINCT DATE(data_atualizacao)) AS media_registros_dia,
    SUM(CASE 
            WHEN DATE(data_atualizacao) = (
                SELECT MAX(DATE(data_atualizacao)) FROM aa
            ) THEN 1 ELSE 0 
        END) AS registros_ultimo_dia,
    (
        SUM(CASE 
                WHEN DATE(data_atualizacao) = (
                    SELECT MAX(DATE(data_atualizacao)) FROM aa
                ) THEN 1 ELSE 0 
            END)
        -
        (COUNT(*) / COUNT(DISTINCT DATE(data_atualizacao)))
    ) AS variacao_registros
FROM aa

UNION ALL

SELECT
    'lp',
    MAX(data_atualizacao),
    COUNT(*),
    COUNT(*) / COUNT(DISTINCT DATE(data_atualizacao)),
    SUM(CASE 
            WHEN DATE(data_atualizacao) = (
                SELECT MAX(DATE(data_atualizacao)) FROM lp
            ) THEN 1 ELSE 0 
        END),
    (
        SUM(CASE 
                WHEN DATE(data_atualizacao) = (
                    SELECT MAX(DATE(data_atualizacao)) FROM lp
                ) THEN 1 ELSE 0 
            END)
        -
        (COUNT(*) / COUNT(DISTINCT DATE(data_atualizacao)))
    )
FROM lp

UNION ALL

SELECT
    'pap - INDIRETO',
    MAX(data_atualizacao),
    COUNT(*),
    COUNT(*) / COUNT(DISTINCT DATE(data_atualizacao)),
    SUM(CASE 
            WHEN DATE(data_atualizacao) = (
                SELECT MAX(DATE(data_atualizacao)) FROM pap
            ) THEN 1 ELSE 0 
        END),
    (
        SUM(CASE 
                WHEN DATE(data_atualizacao) = (
                    SELECT MAX(DATE(data_atualizacao)) FROM pap
                ) THEN 1 ELSE 0 
            END)
        -
        (COUNT(*) / COUNT(DISTINCT DATE(data_atualizacao)))
    )
FROM pap

UNION ALL

SELECT
    'pap - EXCLUSIVOS',
    MAX(data_atualizacao),
    COUNT(*),
    COUNT(*) / COUNT(DISTINCT DATE(data_atualizacao)),
    SUM(CASE 
            WHEN DATE(data_atualizacao) = (
                SELECT MAX(DATE(data_atualizacao)) FROM EXCLUSIVOS
            ) THEN 1 ELSE 0 
        END),
    (
        SUM(CASE 
                WHEN DATE(data_atualizacao) = (
                    SELECT MAX(DATE(data_atualizacao)) FROM EXCLUSIVOS
                ) THEN 1 ELSE 0 
            END)
        -
        (COUNT(*) / COUNT(DISTINCT DATE(data_atualizacao)))
    )
FROM EXCLUSIVOS

UNION ALL

SELECT
    'varejo',
    MAX(data_atualizacao),
    COUNT(*),
    COUNT(*) / COUNT(DISTINCT DATE(data_atualizacao)),
    SUM(CASE 
            WHEN DATE(data_atualizacao) = (
                SELECT MAX(DATE(data_atualizacao)) FROM varejo
            ) THEN 1 ELSE 0 
        END),
    (
        SUM(CASE 
                WHEN DATE(data_atualizacao) = (
                    SELECT MAX(DATE(data_atualizacao)) FROM varejo
                ) THEN 1 ELSE 0 
            END)
        -
        (COUNT(*) / COUNT(DISTINCT DATE(data_atualizacao)))
    )
FROM varejo

UNION ALL

SELECT
    'pme',
    MAX(data_atualizacao),
    COUNT(*),
    COUNT(*) / COUNT(DISTINCT DATE(data_atualizacao)),
    SUM(CASE 
            WHEN DATE(data_atualizacao) = (
                SELECT MAX(DATE(data_atualizacao)) FROM pme
            ) THEN 1 ELSE 0 
        END),
    (
        SUM(CASE 
                WHEN DATE(data_atualizacao) = (
                    SELECT MAX(DATE(data_atualizacao)) FROM pme
                ) THEN 1 ELSE 0 
            END)
        -
        (COUNT(*) / COUNT(DISTINCT DATE(data_atualizacao)))
    )
FROM pme;

    `;
    const [rows] = await dataBase.query(query);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Erro ao buscar data maximas dos relatorios" });
  }
};

export const getAPARELHO = async (req, res) => {
  try {
    const query = `
        SELECT * FROM tbl_dataset_timeline_to_excel3
    
        `; // ex.: ?year=2026&referencia=SP_INT

    const [rows] = await dataBase.query(query);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Erro ao buscar tbl_dataset_timeline_to_excel3" });
  }
};

export const getPAP_grafico = async (req, res) => {
  try {
    // Aceita ?anomes=202601 ou ?ano=2026&mes=1
    let { anomes, ano, mes } = req.query || {};
    anomes = anomes ? Number(anomes) : undefined;

    if (!anomes && ano && mes) {
      ano = Number(ano);
      mes = Number(mes);
      if (!Number.isNaN(ano) && !Number.isNaN(mes) && mes >= 1 && mes <= 12) {
        anomes = ano * 100 + (mes < 10 ? Number(`0${mes}`) : mes);
      }
    }

    let query = "";
    let params = [];

    if (anomes) {
      // Máximo dentro do mês selecionado
      query = `
        WITH CTE_MAX AS (
          SELECT MAX(DATA_ATUALIZACAO) AS data_maxima
          FROM PAP
          WHERE ANOMES = ?
        )
        SELECT
          PAP.anomes,
	PAP.FILIAL_COORDENADOR, 
  PAP.ESTRUTURA,
	count(distinct PAP.PARCEIRO_LOJA) as PARCEIRO_LOJA,
	count(distinct PAP.executivo) as executivo,
	count(distinct PAP.ibge) as ibge
        FROM PAP AS PAP
        JOIN CTE_MAX AS m
          ON PAP.DATA_ATUALIZACAO = m.data_maxima
        WHERE PAP.ANOMES = ?
        GROUP BY PAP.FILIAL_COORDENADOR, PAP.ANOMES
        ORDER BY PARCEIRO_LOJA DESC, executivo DESC, FILIAL_COORDENADOR;
      `;
      params = [anomes, anomes];
    } else {
      // Snapshot global (sem filtro)
      query = `
        WITH CTE_MAX AS (
          SELECT MAX(DATA_ATUALIZACAO) AS data_maxima
          FROM PAP
        )
        SELECT
          PAP.anomes,
	PAP.FILIAL_COORDENADOR,
    PAP.ESTRUTURA, 
	count(distinct PAP.PARCEIRO_LOJA) as PARCEIRO_LOJA,
	count(distinct PAP.executivo) as executivo,
	count(distinct PAP.ibge) as ibge
        FROM PAP AS PAP
        JOIN CTE_MAX AS m
          ON PAP.DATA_ATUALIZACAO = m.data_maxima
         GROUP BY PAP.FILIAL_COORDENADOR, PAP.ANOMES
        ORDER BY PARCEIRO_LOJA DESC, executivo DESC, FILIAL_COORDENADOR;
      `;
      params = [];
    }

    const [rows] = await dataBase.query(query, params);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar getPAP_grafico" });
  }
};

export const getPAP_graficoHistorico = async (req, res) => {
  try {
    const query = `
     WITH max_por_mes AS (
  SELECT
    ANOMES,
    MAX(DATA_ATUALIZACAO) AS data_maxima_mes
  FROM PAP
  GROUP BY ANOMES
)
SELECT
  PAP.ANOMES AS anomes,
  CASE
    WHEN PAP.FILIAL_COORDENADOR IS NULL OR PAP.FILIAL_COORDENADOR = '' THEN NULL
    ELSE SUBSTRING_INDEX(TRIM(PAP.FILIAL_COORDENADOR), ' ', 1)
  END AS FILIAL_COORDENADOR, 
  COUNT(DISTINCT PAP.PARCEIRO_LOJA) AS PARCEIRO_LOJA,
  COUNT(DISTINCT PAP.executivo)        AS qtde_executivos_distintas,
  COUNT(DISTINCT PAP.ibge)      AS ibge
FROM PAP
JOIN max_por_mes m
  ON PAP.ANOMES = m.ANOMES
 AND PAP.DATA_ATUALIZACAO = m.data_maxima_mes
GROUP BY
  PAP.ANOMES,
  CASE
    WHEN PAP.FILIAL_COORDENADOR IS NULL OR PAP.FILIAL_COORDENADOR = '' THEN NULL
    ELSE SUBSTRING_INDEX(TRIM(PAP.FILIAL_COORDENADOR), ' ', 1)
  END
ORDER BY anomes ASC, FILIAL_COORDENADOR ASC;
    `;

    const [rows] = await dataBase.query(query);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar histórico PAP" });
  }
};

/**RELATORIOS */

export const getCotas = async (req, res) => {
  try {
    const query = `
WITH cte_union AS (

    /* =========================
       AA
       ========================= */
    SELECT
        ANOMES,
        CAST(REPLACE(UPPER(CANAL), ' ', '_') AS CHAR) COLLATE utf8mb4_general_ci AS CANAL,
        CAST(UPPER(TRIM(LOGIN_NET)) AS CHAR) COLLATE utf8mb4_general_ci AS CHAVE,
        IBGE,
        CAST(CIDADE AS CHAR) COLLATE utf8mb4_general_ci AS CIDADE,
        CAST(RAZAO_SOCIAL AS CHAR) COLLATE utf8mb4_general_ci AS RAZAO_SOCIAL,
        CAST(PARCEIRO_LOJA AS CHAR) COLLATE utf8mb4_general_ci AS PARCEIRO_LOJA,
        CAST(CNPJ AS CHAR) COLLATE utf8mb4_general_ci AS CNPJ,
        CAST(NOME AS CHAR) COLLATE utf8mb4_general_ci AS NOME,
        CAST(CLASSIFICACAO AS CHAR) COLLATE utf8mb4_general_ci AS CLASSIFICACAO,
        CAST(SEGMENTO AS CHAR) COLLATE utf8mb4_general_ci AS SEGMENTO,
        CAST(PRODUTO_ATUACAO AS CHAR) COLLATE utf8mb4_general_ci AS PRODUTO_ATUACAO,
        CAST(SITUACAO AS CHAR) COLLATE utf8mb4_general_ci AS SITUACAO,
        CAST(LOGIN_NET AS CHAR) COLLATE utf8mb4_general_ci AS LOGIN_NET,
        CAST(TIPO AS CHAR) COLLATE utf8mb4_general_ci AS TIPO,
        CAST(LOGIN_CLARO AS CHAR) COLLATE utf8mb4_general_ci AS LOGIN_CLARO,
        CAST(EXECUTIVO AS CHAR) COLLATE utf8mb4_general_ci AS EXECUTIVO,
        CAST(COMTA AS CHAR) COLLATE utf8mb4_general_ci AS COMTA,
        CAST(CABEAMENTO AS CHAR) COLLATE utf8mb4_general_ci AS CABEAMENTO,
        CAST(FILIAL_COORDENADOR AS CHAR) COLLATE utf8mb4_general_ci AS FILIAL_COORDENADOR

    FROM aa
    WHERE ANOMES = (SELECT MAX(ANOMES) FROM aa)

    UNION ALL

    /* =========================
       LP
       ========================= */
    SELECT
        ANOMES,
        CAST(CANAL AS CHAR) COLLATE utf8mb4_general_ci,
        CAST(UPPER(TRIM(LOGIN_NET)) AS CHAR) COLLATE utf8mb4_general_ci,
        NULL,
        CAST(CIDADE AS CHAR) COLLATE utf8mb4_general_ci,
        NULL,
        CAST(LOJA AS CHAR) COLLATE utf8mb4_general_ci,
        NULL,
        CAST(COLABORADOR AS CHAR) COLLATE utf8mb4_general_ci,
        NULL,
        NULL,
        NULL,
        CAST(STATUS AS CHAR) COLLATE utf8mb4_general_ci,
        CAST(LOGIN_NET AS CHAR) COLLATE utf8mb4_general_ci,
        NULL,
        CAST(LOGIN_CLARO AS CHAR) COLLATE utf8mb4_general_ci,
        NULL,
        CAST(COMTA AS CHAR) COLLATE utf8mb4_general_ci,
        CAST(CABEAMENTO AS CHAR) COLLATE utf8mb4_general_ci,
        CAST(COORDENADOR AS CHAR) COLLATE utf8mb4_general_ci

    FROM lp
    WHERE ANOMES = (SELECT MAX(ANOMES) FROM lp)

)

SELECT *
FROM cte_union;
    `;

    const [rows] = await dataBase.query(query);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar tbl_backlog_agenda" });
  }
};

export const getFullCarteiras = async (req, res) => {
  try {
    const TODAY = format(
      fromZonedTime(new Date(), "America/Sao_Paulo"),
      "yyyyMMdd_HHmmss",
    );

    const query = `
WITH cte_union AS (

    /* =========================
       AA
       ========================= */
    SELECT
        ANOMES,
        CAST(REPLACE(UPPER(CANAL), ' ', '_') AS CHAR(255)) COLLATE utf8mb4_general_ci AS CANAL,
        CAST(UPPER(TRIM(LOGIN_NET)) AS CHAR(255)) COLLATE utf8mb4_general_ci AS CHAVE,
        IBGE,
        CAST(CIDADE AS CHAR(255)) COLLATE utf8mb4_general_ci AS CIDADE,
        CAST(RAZAO_SOCIAL AS CHAR(255)) COLLATE utf8mb4_general_ci AS RAZAO_SOCIAL,
        CAST(PARCEIRO_LOJA AS CHAR(255)) COLLATE utf8mb4_general_ci AS PARCEIRO_LOJA,
        CAST(CNPJ AS CHAR(255)) COLLATE utf8mb4_general_ci AS CNPJ,
        CAST(NOME AS CHAR(255)) COLLATE utf8mb4_general_ci AS NOME,
        CAST(CLASSIFICACAO AS CHAR(255)) COLLATE utf8mb4_general_ci AS CLASSIFICACAO,
        CAST(SEGMENTO AS CHAR(255)) COLLATE utf8mb4_general_ci AS SEGMENTO,
        CAST(PRODUTO_ATUACAO AS CHAR(255)) COLLATE utf8mb4_general_ci AS PRODUTO_ATUACAO,
        CAST(SITUACAO AS CHAR(255)) COLLATE utf8mb4_general_ci AS SITUACAO,
        CAST(LOGIN_NET AS CHAR(255)) COLLATE utf8mb4_general_ci AS LOGIN_NET,
        CAST(TIPO AS CHAR(255)) COLLATE utf8mb4_general_ci AS TIPO,
        CAST(LOGIN_CLARO AS CHAR(255)) COLLATE utf8mb4_general_ci AS LOGIN_CLARO,
        CAST(EXECUTIVO AS CHAR(255)) COLLATE utf8mb4_general_ci AS EXECUTIVO,
        CAST(COMTA AS CHAR(255)) COLLATE utf8mb4_general_ci AS COMTA,
        CAST(CABEAMENTO AS CHAR(255)) COLLATE utf8mb4_general_ci AS CABEAMENTO,
        CAST(FILIAL_COORDENADOR AS CHAR(255)) COLLATE utf8mb4_general_ci AS FILIAL_COORDENADOR
    FROM aa
    WHERE ANOMES = (SELECT MAX(ANOMES) FROM aa)

    UNION ALL

    /* =========================
       LP
       ========================= */
    SELECT
        ANOMES,
        CAST(CANAL AS CHAR(255)) COLLATE utf8mb4_general_ci,
        CAST(UPPER(TRIM(LOGIN_NET)) AS CHAR(255)) COLLATE utf8mb4_general_ci,
        NULL,
        CAST(CIDADE AS CHAR(255)) COLLATE utf8mb4_general_ci,
        NULL,
        CAST(LOJA AS CHAR(255)) COLLATE utf8mb4_general_ci,
        NULL,
        CAST(COLABORADOR AS CHAR(255)) COLLATE utf8mb4_general_ci,
        NULL,
        NULL,
        NULL,
        CAST(STATUS AS CHAR(255)) COLLATE utf8mb4_general_ci,
        CAST(LOGIN_NET AS CHAR(255)) COLLATE utf8mb4_general_ci,
        NULL,
        CAST(LOGIN_CLARO AS CHAR(255)) COLLATE utf8mb4_general_ci,
        NULL,
        CAST(COMTA AS CHAR(255)) COLLATE utf8mb4_general_ci,
        CAST(CABEAMENTO AS CHAR(255)) COLLATE utf8mb4_general_ci,
        CAST(COORDENADOR AS CHAR(255)) COLLATE utf8mb4_general_ci
    FROM lp
    WHERE ANOMES = (SELECT MAX(ANOMES) FROM lp)

    UNION ALL

    /* =========================
       PAP
       ========================= */
    SELECT
        ANOMES,
        CAST(CONCAT(CANAL, '_', ESTRUTURA) AS CHAR(255)) COLLATE utf8mb4_general_ci,
        CAST(
          CASE
            WHEN ESTRUTURA = 'INDIRETO'
              THEN CONCAT(IBGE, CNPJ)
            ELSE CONCAT(IBGE, LOGIN_NET)
          END AS CHAR(255)
        ) COLLATE utf8mb4_general_ci,
        IBGE,
        NULL,
        NULL,
        CAST(PARCEIRO_LOJA AS CHAR(255)) COLLATE utf8mb4_general_ci,
        CAST(CNPJ AS CHAR(255)) COLLATE utf8mb4_general_ci,
        CAST(NOME AS CHAR(255)) COLLATE utf8mb4_general_ci,
        CAST(CLASSIFICACAO AS CHAR(255)) COLLATE utf8mb4_general_ci,
        CAST(SEGMENTO AS CHAR(255)) COLLATE utf8mb4_general_ci,
        NULL,
        CAST(SITUACAO AS CHAR(255)) COLLATE utf8mb4_general_ci,
        CAST(LOGIN_NET AS CHAR(255)) COLLATE utf8mb4_general_ci,
        NULL,
        CAST(LOGIN_CLARO AS CHAR(255)) COLLATE utf8mb4_general_ci,
        CAST(EXECUTIVO AS CHAR(255)) COLLATE utf8mb4_general_ci,
        NULL,
        NULL,
        CAST(FILIAL_COORDENADOR AS CHAR(255)) COLLATE utf8mb4_general_ci
    FROM pap
    WHERE ANOMES = (SELECT MAX(ANOMES) FROM pap)

    UNION ALL

    /* =========================
       VAREJO
       ========================= */
    SELECT
        ANOMES,
        CAST(CANAL AS CHAR(255)) COLLATE utf8mb4_general_ci,
        CAST(CONCAT(IBGE, LEFT(CNPJ, 8)) AS CHAR(255)) COLLATE utf8mb4_general_ci,
        IBGE,
        NULL,
        NULL,
        CAST(PARCEIRO_LOJA AS CHAR(255)) COLLATE utf8mb4_general_ci,
        CAST(CNPJ AS CHAR(255)) COLLATE utf8mb4_general_ci,
        CAST(NOME_COLABORADOR AS CHAR(255)) COLLATE utf8mb4_general_ci,
        NULL,
        NULL,
        CAST(PRODUTO_ATUACAO AS CHAR(255)) COLLATE utf8mb4_general_ci,
        CAST(SITUACAO AS CHAR(255)) COLLATE utf8mb4_general_ci,
        CAST(LOGIN_NET AS CHAR(255)) COLLATE utf8mb4_general_ci,
        NULL,
        NULL,
        CAST(GN AS CHAR(255)) COLLATE utf8mb4_general_ci,
        CAST(COD_PDV AS CHAR(255)) COLLATE utf8mb4_general_ci,
        NULL,
        CAST(FILIAL_COORDENADOR AS CHAR(255)) COLLATE utf8mb4_general_ci
    FROM varejo
    WHERE ANOMES = (SELECT MAX(ANOMES) FROM varejo)
)

SELECT * FROM cte_union;
    `;

    // Detecta abort do cliente (não é erro)
    req.on("aborted", () => {
      console.warn("⚠️ Cliente abortou o download.");
    });

    const [rows] = await dataBase.query(query);

    if (!rows.length) {
      return res.status(204).json({ message: "Nenhum dado para exportar" });
    }

    // Excel
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Carteiras");

    const tmpDir = path.join(process.cwd(), "tmp");
    fs.mkdirSync(tmpDir, { recursive: true });

    const fileName = `carteiras_completas_${TODAY}.xlsx`;
    const filePath = path.join(tmpDir, fileName);
    XLSX.writeFile(workbook, filePath);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    res.download(filePath, fileName, (err) => {
      if (err && err.code !== "ECONNABORTED") {
        console.error("Erro no download:", err);
      }
      fs.unlink(filePath, () => {});
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Erro ao gerar Excel – Carteiras completas",
      sql: err.sqlMessage || err.message,
    });
  }
};
export const getFullPAP = async (req, res) => {
  try {
    const TODAY = format(
      fromZonedTime(new Date(), "America/Sao_Paulo"),
      "yyyyMMdd_HHmmss",
    );

    const query = `WITH
CTEmaxPAP AS (
    SELECT MAX(DATA_ATUALIZACAO) AS MAX_DATA
    FROM pap
),
CTEmaxEXCLUSIVOS AS (
    SELECT MAX(DATA_ATUALIZACAO) AS MAX_DATA
    FROM exclusivos
)

SELECT
    P.ANOMES,
    P.CANAL,
    P.ESTRUTURA,
    P.IBGE,
    P.CNPJ,
    P.PARCEIRO_LOJA,
    P.CLASSIFICACAO,
    P.SEGMENTO,
    P.LOGIN_NET,
    P.LOGIN_CLARO,
    P.NOME,
    P.DATA_CADASTRO_VENDEDOR,
    P.SITUACAO,
    P.EXECUTIVO,

    NULL AS REGIONAL,
    NULL AS MAT_BCC,
    NULL AS MAT_REVOLUTION,
    NULL AS FUNCIONARIO,
    NULL AS CARGO,
    NULL AS GESTOR_1,
    NULL AS GESTOR_2,
    NULL AS GESTOR_3,
    NULL AS CIDADE,
    NULL AS STATUS,
    NULL AS ADMISSAO,
    NULL AS LOGIN_NET_EXCLUSIVOS,
    NULL AS CHAVE,
    NULL AS MATRICULA_EXECUTIVO,
    NULL AS EXECUTIVO_EXCLUSIVOS,

    P.FILIAL_COORDENADOR,
    'PAP' AS ORIGEM
FROM pap P
INNER JOIN CTEmaxPAP MP
    ON P.DATA_ATUALIZACAO = MP.MAX_DATA

UNION ALL

SELECT
    E.ANOMES,
    E.CANAL,
    NULL AS ESTRUTURA,
    NULL AS IBGE,
    NULL AS CNPJ,
    NULL AS PARCEIRO_LOJA,
    NULL AS CLASSIFICACAO,
    NULL AS SEGMENTO,
    E.LOGIN_NET,
    NULL AS LOGIN_CLARO,
    E.FUNCIONARIO AS NOME,
    NULL AS DATA_CADASTRO_VENDEDOR,
    E.STATUS AS SITUACAO,
    E.EXECUTIVO,

    E.REGIONAL,
    E.MAT_BCC,
    E.MAT_REVOLUTION,
    E.FUNCIONARIO,
    E.CARGO,
    E.GESTOR_1,
    E.GESTOR_2,
    E.GESTOR_3,
    E.CIDADE,
    E.STATUS,
    E.ADMISSAO,
    E.LOGIN_NET AS LOGIN_NET_EXCLUSIVOS,
    E.CHAVE,
    E.MATRICULA_EXECUTIVO,
    E.EXECUTIVO AS EXECUTIVO_EXCLUSIVOS,

    E.FILIAL_COORDENADOR,
    'EXCLUSIVOS' AS ORIGEM
FROM exclusivos E
INNER JOIN CTEmaxEXCLUSIVOS ME
    ON E.DATA_ATUALIZACAO = ME.MAX_DATA;
    `;

    // Detecta abort do cliente (não é erro)
    req.on("aborted", () => {
      console.warn("⚠️ Cliente abortou o download.");
    });

    const [rows] = await dataBase.query(query);

    if (!rows.length) {
      return res.status(204).json({ message: "Nenhum dado para exportar" });
    }

    // Excel
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Carteiras");

    const tmpDir = path.join(process.cwd(), "tmp");
    fs.mkdirSync(tmpDir, { recursive: true });

    const fileName = `PAP_completas_${TODAY}.xlsx`;
    const filePath = path.join(tmpDir, fileName);
    XLSX.writeFile(workbook, filePath);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    res.download(filePath, fileName, (err) => {
      if (err && err.code !== "ECONNABORTED") {
        console.error("Erro no download:", err);
      }
      fs.unlink(filePath, () => {});
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Erro ao gerar Excel – PAP completas",
      sql: err.sqlMessage || err.message,
    });
  }
};
