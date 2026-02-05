import { dataBase } from "../DataBase/dataBase.js";
import dotenv from "dotenv";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

dotenv.config();

const buildDateFilter = (tableAlias, start, end, latest) => {
  const where = [];
  const params = [];

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
        FROM ${tableAlias === "LP" ? "LP" : "PAP"}
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
      limit = 1000,
      offset = 0,
      orderBy = "ID",
      orderDir = "DESC",
    } = req.query;

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
    let {
      q,
      start,
      end,
      latest,
      limit = 2000,
      offset = 0,
      orderBy = "ID",
      orderDir = "DESC",
    } = req.query;

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

export const getPAP_PREMIUM = async (req, res) => {
  try {
    let {
      q,
      start,
      end,
      latest,
      limit = 2000,
      offset = 0,
      orderBy = "ID",
      orderDir = "DESC",
    } = req.query;

    limit = Math.min(Number(limit) || 2000, 5000);
    offset = Number(offset) || 0;

    const validOrder = ["ID", "CIDADE", "IBGE"];
    orderBy = validOrder.includes(orderBy) ? orderBy : "ID";
    orderDir = orderDir.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const mainFilters = buildDateFilter("pap_premium", start, end, latest);
    const where = mainFilters.where;
    const params = mainFilters.params;

    if (q) {
      const like = `%${q}%`;
      where.push(`
        (pap_premium.CANAL LIKE ? OR pap_premium.IBGE LIKE ? OR pap_premium.CIDADE LIKE ? OR 
         pap_premium.RAZAO_SOCIAL LIKE ? OR pap_premium.CNPJ LIKE ? OR pap_premium.NOME LIKE ? OR
         pap_premium.CLASSIFICACAO LIKE ? OR pap_premium.SEGMENTO LIKE ? OR pap_premium.PRODUTO_ATUACAO LIKE ?)
      `);
      params.push(like, like, like, like, like, like, like, like, like);
    }

    const sql = `
      SELECT pap_premium.*
      FROM pap_premium
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY pap_premium.${orderBy} ${orderDir}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const [rows] = await dataBase.query(sql, params);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar pap_premium" });
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
      };
      const key = referencia.toString().toUpperCase().trim();
      const mapped = refMap[key] || referencia;

      // Vamos usar p.REF_NORM (normalizada no subselect)
      if (["BR", "BRASIL"].includes(key)) {
        // Igualdade direta
        joinFilters.push("p.REF_NORM = 'BRASIL'");
      } else if (
        ["SP_INT", "SÃO PAULO INTERIOR", "SAO PAULO INTERIOR"].includes(key)
      ) {
        // Aceita SÃO / SAO / S?O
        joinFilters.push("p.REF_NORM REGEXP '^S.?O PAULO INTERIOR$'");
      } else {
        // Valor arbitrário informado pelo usuário -> igualdade na forma normalizada
        joinFilters.push("p.REF_NORM = UPPER(?)");
        joinParams.push(mapped);
      }
    }

    // MOVEL (novo) -> normaliza para boolean (true/false) e compara com DECIMAL(18,6)
    // Em sua tabela, MOVEL é DECIMAL(18,6) e pode ser NULL. Vamos arredondar e coalescer para evitar NULL.
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
      // Ajuste para DECIMAL(18,6): ROUND(COALESCE(MOVEL, -1), 0) = 0/1
      joinFilters.push("ROUND(COALESCE(p.MOVEL, -1), 0) = ?");
      joinParams.push(movelFilter ? 1 : 0);
    }

    const extraOn = joinFilters.length
      ? ` AND ${joinFilters.join(" AND ")}`
      : "";

    // Flags
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

    // IMPORTANTE:
    // - Usamos subselect para converter DT (varchar dd/mm/yyyy) -> DT_DATE
    // - Normalizamos REFERENCIA removendo '\r' e espaços, em maiúsculo -> REF_NORM
    // - Mantém filtros apenas no JOIN (extraOn)
    const sql = `
      WITH
      params AS (
        SELECT
          ${refDateBaseExpr} AS ref_date_base,
          CURDATE()          AS today_real
      ),
      bounds AS (
        SELECT
          -- âncora da data de referência (real ou simulada)
          CASE
            WHEN ${hasYear ? 1 : 0} = 1 THEN
              LEAST(
                DATE_ADD(ref_date_base, INTERVAL (DAY(CURDATE()) - 1) DAY),
                LAST_DAY(ref_date_base)
              )
            ELSE
              ref_date_base
          END AS ref_anchor,

          -- mês atual (primeiro/último dia) com base na âncora
          DATE_FORMAT(
            CASE
              WHEN ${hasYear ? 1 : 0} = 1 THEN
                LEAST(DATE_ADD(ref_date_base, INTERVAL (DAY(CURDATE()) - 1) DAY), LAST_DAY(ref_date_base))
              ELSE ref_date_base
            END, '%Y-%m-01'
          ) AS first_day_cur,

          LAST_DAY(
            CASE
              WHEN ${hasYear ? 1 : 0} = 1 THEN
                LEAST(DATE_ADD(ref_date_base, INTERVAL (DAY(CURDATE()) - 1) DAY), LAST_DAY(ref_date_base))
              ELSE ref_date_base
            END
          ) AS last_day_cur,

          -- mês anterior / próximo
          DATE_FORMAT(DATE_SUB(
            CASE
              WHEN ${hasYear ? 1 : 0} = 1 THEN
                LEAST(DATE_ADD(ref_date_base, INTERVAL (DAY(CURDATE()) - 1) DAY), LAST_DAY(ref_date_base))
              ELSE ref_date_base
            END, INTERVAL 1 MONTH
          ), '%Y-%m-01') AS first_day_prev,

          LAST_DAY(DATE_SUB(
            CASE
              WHEN ${hasYear ? 1 : 0} = 1 THEN
                LEAST(DATE_ADD(ref_date_base, INTERVAL (DAY(CURDATE()) - 1) DAY), LAST_DAY(ref_date_base))
              ELSE ref_date_base
            END, INTERVAL 1 MONTH
          )) AS last_day_prev,

          DATE_FORMAT(DATE_ADD(
            CASE
              WHEN ${hasYear ? 1 : 0} = 1 THEN
                LEAST(DATE_ADD(ref_date_base, INTERVAL (DAY(CURDATE()) - 1) DAY), LAST_DAY(ref_date_base))
              ELSE ref_date_base
            END, INTERVAL 1 MONTH
          ), '%Y-%m-01') AS first_day_next,

          LAST_DAY(DATE_ADD(
            CASE
              WHEN ${hasYear ? 1 : 0} = 1 THEN
                LEAST(DATE_ADD(ref_date_base, INTERVAL (DAY(CURDATE()) - 1) DAY), LAST_DAY(ref_date_base))
              ELSE ref_date_base
            END, INTERVAL 1 MONTH
          )) AS last_day_next,

          -- hoje efetivo
          CASE
            WHEN ${hasYear ? 1 : 0} = 1 THEN
              LEAST(
                DATE_ADD(ref_date_base, INTERVAL (DAY(CURDATE()) - 1) DAY),
                LAST_DAY(ref_date_base)
              )
            ELSE
              LEAST(ref_date_base, LAST_DAY(ref_date_base))
          END AS today_eff,

          -- mês equivalente do ano passado (primeiro/último dia)
          DATE_SUB(
            DATE_FORMAT(
              CASE
                WHEN ${hasYear ? 1 : 0} = 1 THEN
                  LEAST(DATE_ADD(ref_date_base, INTERVAL (DAY(CURDATE()) - 1) DAY), LAST_DAY(ref_date_base))
                ELSE ref_date_base
              END, '%Y-%m-01'
            ),
            INTERVAL 1 YEAR
          ) AS first_day_cur_prev_year,

          LAST_DAY(
            DATE_SUB(
              CASE
                WHEN ${hasYear ? 1 : 0} = 1 THEN
                  LEAST(DATE_ADD(ref_date_base, INTERVAL (DAY(CURDATE()) - 1) DAY), LAST_DAY(ref_date_base))
                ELSE ref_date_base
              END,
              INTERVAL 1 YEAR
            )
          ) AS last_day_cur_prev_year
        FROM params
      )
      SELECT
        b.today_eff AS data_referencia,

        DAY(b.last_day_cur) AS dias_no_mes,
        DATEDIFF(b.today_eff, b.first_day_cur) + 1 AS dias_passados,
        GREATEST(DAY(b.last_day_cur) - (DATEDIFF(b.today_eff, b.first_day_cur) + 1), 0) AS dias_restantes,

        ROUND(100 * (DATEDIFF(b.today_eff, b.first_day_cur) + 1) / DAY(b.last_day_cur), 2) AS perc_mes_transcorrido,

        /* SOMAS POR JANELA (prev/cur/next) */
        SUM(CASE WHEN p.DT_DATE BETWEEN b.first_day_cur  AND b.last_day_cur  THEN p.INST ELSE 0 END) AS inst_mes_atual,
        SUM(CASE WHEN p.DT_DATE BETWEEN b.first_day_prev AND b.last_day_prev THEN p.INST ELSE 0 END) AS inst_mes_anterior,
        SUM(CASE WHEN p.DT_DATE BETWEEN b.first_day_next AND b.last_day_next THEN p.INST ELSE 0 END) AS inst_prox_mes,

        SUM(CASE WHEN p.DT_DATE BETWEEN b.first_day_cur  AND b.last_day_cur  THEN p.VB ELSE 0 END) AS vb_mes_atual,
        SUM(CASE WHEN p.DT_DATE BETWEEN b.first_day_prev AND b.last_day_prev THEN p.VB ELSE 0 END) AS vb_mes_anterior,
        SUM(CASE WHEN p.DT_DATE BETWEEN b.first_day_next AND b.last_day_next THEN p.VB ELSE 0 END) AS vb_prox_mes,

        /* Acumulado até hoje (real ou simulado) */
        SUM(CASE WHEN p.DT_DATE BETWEEN b.first_day_cur AND b.today_eff THEN p.INST ELSE 0 END) AS inst_ate_hoje,
        SUM(CASE WHEN p.DT_DATE BETWEEN b.first_day_cur AND b.today_eff THEN p.VB   ELSE 0 END) AS vb_ate_hoje,

        /* Mês atual do ano passado */
        SUM(CASE WHEN p.DT_DATE BETWEEN b.first_day_cur_prev_year AND b.last_day_cur_prev_year THEN p.INST ELSE 0 END) AS inst_mes_ano_passado,
        SUM(CASE WHEN p.DT_DATE BETWEEN b.first_day_cur_prev_year AND b.last_day_cur_prev_year THEN p.VB   ELSE 0 END) AS vb_mes_ano_passado

      FROM bounds b
      LEFT JOIN (
        /* Converte DT e normaliza REFERENCIA uma única vez */
        SELECT
          STR_TO_DATE(DT, '%d/%m/%Y') AS DT_DATE,
          INST,
          VB,
          MOVEL,
          UPPER(TRIM(REPLACE(REFERENCIA, '\r', ''))) AS REF_NORM
        FROM pdu
      ) p
        ON (
             (p.DT_DATE BETWEEN b.first_day_prev AND b.last_day_next)
             OR
             (p.DT_DATE BETWEEN b.first_day_cur_prev_year AND b.last_day_cur_prev_year)
           )
        ${extraOn}
      GROUP BY
        b.today_eff, b.first_day_cur, b.last_day_cur,
        b.first_day_prev, b.last_day_prev,
        b.first_day_next, b.last_day_next,
        b.first_day_cur_prev_year, b.last_day_cur_prev_year
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

    // Filtro para otimizar o JOIN (apenas Brasil e SPI)
    const regionFilter =
      "(p.REF_NORM = 'BRASIL' OR p.REF_NORM REGEXP '^S.?O PAULO INTERIOR$')";

    const sql = `
      WITH
      params AS (
        SELECT
          ${refDateBaseExpr} AS ref_date_base,
          CURDATE()          AS today_real
      ),
      bounds AS (
        SELECT
          -- Âncora (hoje efetivo)
          CASE
            WHEN ${hasYear ? 1 : 0} = 1 THEN
              LEAST(
                DATE_ADD(ref_date_base, INTERVAL (DAY(CURDATE()) - 1) DAY),
                LAST_DAY(ref_date_base)
              )
            ELSE
              LEAST(ref_date_base, LAST_DAY(ref_date_base))
          END AS today_eff,

          -- Mês atual (primeiro/último dia)
          DATE_FORMAT(
            CASE
              WHEN ${hasYear ? 1 : 0} = 1 THEN
                LEAST(DATE_ADD(ref_date_base, INTERVAL (DAY(CURDATE()) - 1) DAY), LAST_DAY(ref_date_base))
              ELSE ref_date_base
            END, '%Y-%m-01'
          ) AS first_day_cur,

          LAST_DAY(
            CASE
              WHEN ${hasYear ? 1 : 0} = 1 THEN
                LEAST(DATE_ADD(ref_date_base, INTERVAL (DAY(CURDATE()) - 1) DAY), LAST_DAY(ref_date_base))
              ELSE ref_date_base
            END
          ) AS last_day_cur,

          -- Mês anterior
          DATE_FORMAT(DATE_SUB(
            CASE
              WHEN ${hasYear ? 1 : 0} = 1 THEN
                LEAST(DATE_ADD(ref_date_base, INTERVAL (DAY(CURDATE()) - 1) DAY), LAST_DAY(ref_date_base))
              ELSE ref_date_base
            END, INTERVAL 1 MONTH
          ), '%Y-%m-01') AS first_day_prev,

          LAST_DAY(DATE_SUB(
            CASE
              WHEN ${hasYear ? 1 : 0} = 1 THEN
                LEAST(DATE_ADD(ref_date_base, INTERVAL (DAY(CURDATE()) - 1) DAY), LAST_DAY(ref_date_base))
              ELSE ref_date_base
            END, INTERVAL 1 MONTH
          )) AS last_day_prev,

          -- Próximo mês
          DATE_FORMAT(DATE_ADD(
            CASE
              WHEN ${hasYear ? 1 : 0} = 1 THEN
                LEAST(DATE_ADD(ref_date_base, INTERVAL (DAY(CURDATE()) - 1) DAY), LAST_DAY(ref_date_base))
              ELSE ref_date_base
            END, INTERVAL 1 MONTH
          ), '%Y-%m-01') AS first_day_next,

          LAST_DAY(DATE_ADD(
            CASE
              WHEN ${hasYear ? 1 : 0} = 1 THEN
                LEAST(DATE_ADD(ref_date_base, INTERVAL (DAY(CURDATE()) - 1) DAY), LAST_DAY(ref_date_base))
              ELSE ref_date_base
            END, INTERVAL 1 MONTH
          )) AS last_day_next,

          -- Mês atual do ano passado
          DATE_SUB(
            DATE_FORMAT(
              CASE
                WHEN ${hasYear ? 1 : 0} = 1 THEN
                  LEAST(DATE_ADD(ref_date_base, INTERVAL (DAY(CURDATE()) - 1) DAY), LAST_DAY(ref_date_base))
                ELSE ref_date_base
              END, '%Y-%m-01'
            ),
            INTERVAL 1 YEAR
          ) AS first_day_cur_prev_year,

          LAST_DAY(
            DATE_SUB(
              CASE
                WHEN ${hasYear ? 1 : 0} = 1 THEN
                  LEAST(DATE_ADD(ref_date_base, INTERVAL (DAY(CURDATE()) - 1) DAY), LAST_DAY(ref_date_base))
                ELSE ref_date_base
              END,
              INTERVAL 1 YEAR
            )
          ) AS last_day_cur_prev_year
        FROM params
      )
      SELECT
        b.today_eff AS data_referencia,

        DAY(b.last_day_cur) AS dias_no_mes,
        DATEDIFF(b.today_eff, b.first_day_cur) + 1 AS dias_passados,
        GREATEST(DAY(b.last_day_cur) - (DATEDIFF(b.today_eff, b.first_day_cur) + 1), 0) AS dias_restantes,
        ROUND(100 * (DATEDIFF(b.today_eff, b.first_day_cur) + 1) / DAY(b.last_day_cur), 2) AS perc_mes_transcorrido,

        /* ------------------------------------------------------------------
           MAPEAMENTO:
           inst_... = BRASIL (Soma de Movel)
           vb_...   = SPI    (Soma de Movel)
           ------------------------------------------------------------------ */

        /* --- MÊS ATUAL --- */
        -- inst_mes_atual -> BRASIL
        SUM(CASE 
            WHEN p.DT_DATE BETWEEN b.first_day_cur AND b.last_day_cur 
             AND p.REF_NORM = 'BRASIL' 
            THEN p.MOVEL ELSE 0 
        END) AS inst_mes_atual,
        
        -- vb_mes_atual -> SPI
        SUM(CASE 
            WHEN p.DT_DATE BETWEEN b.first_day_cur AND b.last_day_cur 
             AND p.REF_NORM REGEXP '^S.?O PAULO INTERIOR$' 
            THEN p.MOVEL ELSE 0 
        END) AS vb_mes_atual,


        /* --- MÊS ANTERIOR --- */
        -- inst_mes_anterior -> BRASIL
        SUM(CASE 
            WHEN p.DT_DATE BETWEEN b.first_day_prev AND b.last_day_prev 
             AND p.REF_NORM = 'BRASIL' 
            THEN p.MOVEL ELSE 0 
        END) AS inst_mes_anterior,

        -- vb_mes_anterior -> SPI
        SUM(CASE 
            WHEN p.DT_DATE BETWEEN b.first_day_prev AND b.last_day_prev 
             AND p.REF_NORM REGEXP '^S.?O PAULO INTERIOR$' 
            THEN p.MOVEL ELSE 0 
        END) AS vb_mes_anterior,


        /* --- PRÓXIMO MÊS --- */
        -- inst_prox_mes -> BRASIL
        SUM(CASE 
            WHEN p.DT_DATE BETWEEN b.first_day_next AND b.last_day_next 
             AND p.REF_NORM = 'BRASIL' 
            THEN p.MOVEL ELSE 0 
        END) AS inst_prox_mes,

        -- vb_prox_mes -> SPI
        SUM(CASE 
            WHEN p.DT_DATE BETWEEN b.first_day_next AND b.last_day_next 
             AND p.REF_NORM REGEXP '^S.?O PAULO INTERIOR$' 
            THEN p.MOVEL ELSE 0 
        END) AS vb_prox_mes,


        /* --- ACUMULADO ATÉ HOJE --- */
        -- inst_ate_hoje -> BRASIL
        SUM(CASE 
            WHEN p.DT_DATE BETWEEN b.first_day_cur AND b.today_eff 
             AND p.REF_NORM = 'BRASIL' 
            THEN p.MOVEL ELSE 0 
        END) AS inst_ate_hoje,

        -- vb_ate_hoje -> SPI
        SUM(CASE 
            WHEN p.DT_DATE BETWEEN b.first_day_cur AND b.today_eff 
             AND p.REF_NORM REGEXP '^S.?O PAULO INTERIOR$' 
            THEN p.MOVEL ELSE 0 
        END) AS vb_ate_hoje,


        /* --- MÊS ATUAL DO ANO PASSADO --- */
        -- inst_mes_ano_passado -> BRASIL
        SUM(CASE 
            WHEN p.DT_DATE BETWEEN b.first_day_cur_prev_year AND b.last_day_cur_prev_year 
             AND p.REF_NORM = 'BRASIL' 
            THEN p.MOVEL ELSE 0 
        END) AS inst_mes_ano_passado,

        -- vb_mes_ano_passado -> SPI
        SUM(CASE 
            WHEN p.DT_DATE BETWEEN b.first_day_cur_prev_year AND b.last_day_cur_prev_year 
             AND p.REF_NORM REGEXP '^S.?O PAULO INTERIOR$' 
            THEN p.MOVEL ELSE 0 
        END) AS vb_mes_ano_passado

      FROM bounds b
      LEFT JOIN (
        SELECT
          STR_TO_DATE(DT, '%d/%m/%Y') AS DT_DATE,
          MOVEL,
          UPPER(TRIM(REPLACE(REFERENCIA, '\r', ''))) AS REF_NORM
        FROM pdu
      ) p
        ON (
             (
               (p.DT_DATE BETWEEN b.first_day_prev AND b.last_day_next)
               OR
               (p.DT_DATE BETWEEN b.first_day_cur_prev_year AND b.last_day_cur_prev_year)
             )
             AND ${regionFilter}
           )
      GROUP BY
        b.today_eff, b.first_day_cur, b.last_day_cur,
        b.first_day_prev, b.last_day_prev,
        b.first_day_next, b.last_day_next,
        b.first_day_cur_prev_year, b.last_day_cur_prev_year
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
              MOVEL_soma: 0 
            }
          : {
              anomes,
              VB_soma_br: 0,
              VB_soma_RSI: 0,
              INST_soma_br: 0,
              INST_soma_RSI: 0,
              MOVEL_soma_br: 0,  // <--- Inicializa BR
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
