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

// controllers/pdu.js
export const getPDU = async (req, res) => {
  try {
    const { refDate, year, referencia } = req.query; // ex.: ?year=2026&referencia=SP_INT

    // Monta filtros dinâmicos APENAS para REFERENCIA
    const joinFilters = [];
    const joinParams = [];

    if (referencia) {
      const refMap = {
        BR: "BRASIL",
        BRASIL: "BRASIL",
        SP_INT: "SÃO PAULO INTERIOR",
        "SÃO PAULO INTERIOR": "SÃO PAULO INTERIOR",
        "SAO PAULO INTERIOR": "SÃO PAULO INTERIOR",
      };
      const key = referencia.toString().toUpperCase();
      const mapped = refMap[key] || referencia;
      joinFilters.push("UPPER(p.REFERENCIA) = UPPER(?)");
      joinParams.push(mapped);
    }
    const extraOn = joinFilters.length
      ? ` AND ${joinFilters.join(" AND ")}`
      : "";

    // Flags
    const hasRefDate = !!refDate;
    const hasYear = !!year && /^\d{4}$/.test(String(year));

    // Parâmetros que alimentam a CTE `params`
    // ref_date_base:
    //   - se refDate: usa DATE(?)
    //   - senão, se year: usa "YYYY-(mesAtual)-01"
    //   - senão: CURDATE()
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
          -- Se year vier, simulamos "hoje" naquele ano: mesmo dia do mês, capado ao último dia
          CASE
            WHEN ${hasYear ? 1 : 0} = 1 THEN
              LEAST(
                DATE_ADD(ref_date_base, INTERVAL (DAY(CURDATE()) - 1) DAY),
                LAST_DAY(ref_date_base)
              )
            ELSE
              ref_date_base
          END AS ref_date,

          -- 1º/último dia do mês da ref_date (simulada ou real)
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

          -- Mês anterior / próximo a partir da ref_date calculada (cruzando ano corretamente)
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

          -- "Hoje efetivo" no mês da ref_date (real ou simulada)
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
      )
      SELECT
        -- Devolvemos a data de referência como "hoje efetivo"
        b.today_eff AS data_referencia,

        DAY(b.last_day_cur) AS dias_no_mes,
        DATEDIFF(b.today_eff, b.first_day_cur) + 1 AS dias_passados,
        GREATEST(DAY(b.last_day_cur) - (DATEDIFF(b.today_eff, b.first_day_cur) + 1), 0) AS dias_restantes,

        ROUND(100 * (DATEDIFF(b.today_eff, b.first_day_cur) + 1) / DAY(b.last_day_cur), 2) AS perc_mes_transcorrido,

        /* SOMAS POR JANELA (prev/cur/next) — cruzam de ano normalmente */
        SUM(CASE WHEN p.DT BETWEEN b.first_day_cur  AND b.last_day_cur  THEN p.INST ELSE 0 END) AS inst_mes_atual,
        SUM(CASE WHEN p.DT BETWEEN b.first_day_prev AND b.last_day_prev THEN p.INST ELSE 0 END) AS inst_mes_anterior,
        SUM(CASE WHEN p.DT BETWEEN b.first_day_next AND b.last_day_next THEN p.INST ELSE 0 END) AS inst_prox_mes,

        SUM(CASE WHEN p.DT BETWEEN b.first_day_cur  AND b.last_day_cur  THEN p.VB ELSE 0 END) AS vb_mes_atual,
        SUM(CASE WHEN p.DT BETWEEN b.first_day_prev AND b.last_day_prev THEN p.VB ELSE 0 END) AS vb_mes_anterior,
        SUM(CASE WHEN p.DT BETWEEN b.first_day_next AND b.last_day_next THEN p.VB ELSE 0 END) AS vb_prox_mes,

        /* Acumulado até "hoje" (real ou simulado) no mês atual */
        SUM(CASE WHEN p.DT BETWEEN b.first_day_cur AND b.today_eff THEN p.INST ELSE 0 END) AS inst_ate_hoje,
        SUM(CASE WHEN p.DT BETWEEN b.first_day_cur AND b.today_eff THEN p.VB   ELSE 0 END) AS vb_ate_hoje

      FROM bounds b
      LEFT JOIN pdu p
        ON p.DT BETWEEN b.first_day_prev AND b.last_day_next
        ${extraOn}
      GROUP BY
        b.today_eff, b.first_day_cur, b.last_day_cur,
        b.first_day_prev, b.last_day_prev,
        b.first_day_next, b.last_day_next
    `;

    const [rows] = await dataBase.query(sql, [...refParams, ...joinParams]);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar PDU" });
  }
};
// get_full.js
export const getPduFull = async (req, res) => {
  try {
    const { year, referencia } = req.query; // ?year=2026&referencia=SP_INT

    // Normaliza e valida
    const hasYear = !!year && /^\d{4}$/.test(String(year));
    const refKey = (referencia || "").toString().toUpperCase().trim();

    // Mapa de preferências do front → valores salvos no banco
    const REF_MAP = {
      BR: "BRASIL",
      BRASIL: "BRASIL",
      SP_INT: "SAO PAULO INTERIOR",
      "SAO PAULO INTERIOR": "SAO PAULO INTERIOR",
      RSI: "SAO PAULO INTERIOR", // se você usar RSI no front
    };

    const refDbValue = REF_MAP[refKey]; // undefined se não mapeado

    // Construção dinâmica, mas com parâmetros (sem interpolar valores!)
    const params = [];
    const where = [];

    // Se você TEM coluna AAAA (ano), use:
    if (hasYear) {
      where.push(`AAAA = ?`);
      params.push(Number(year));
    }

    // Se quiser filtrar pela preferencia, filtre aqui (versão 'narrow'):
    // Mas só vamos filtrar se o cliente pediu 'apenas' uma preferência.
    if (refDbValue) {
      where.push(`referencia = ?`);
      params.push(refDbValue);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Se a preferência foi passada, entregamos só as colunas daquela preferência (mais leve)
    const onlyOneRef = Boolean(refDbValue);

    const selectSql = onlyOneRef
      ? `
        SELECT
          anomes,
          SUM(VB)   AS VB_soma,
          SUM(INST) AS INST_soma
        FROM pdu
        ${whereSql}
        GROUP BY anomes
        ORDER BY anomes
      `
      : `
        SELECT
          anomes,
          SUM(CASE WHEN referencia = 'BRASIL' THEN VB ELSE 0 END) AS VB_soma_br,
          SUM(CASE WHEN referencia = 'SAO PAULO INTERIOR' THEN VB ELSE 0 END) AS VB_soma_RSI,
          SUM(CASE WHEN referencia = 'BRASIL' THEN INST ELSE 0 END) AS INST_soma_br,
          SUM(CASE WHEN referencia = 'SAO PAULO INTERIOR' THEN INST ELSE 0 END) AS INST_soma_RSI
        FROM pdu
        ${whereSql}
        GROUP BY anomes
        ORDER BY anomes
      `;

    const [rows] = await dataBase.query(selectSql, params);

    // (Opcional) — garantir esqueleto com 12 meses quando year for informado
    // Isso evita que o gráfico “pule” meses sem dados.
    if (hasYear) {
      const skeleton = Array.from({ length: 12 }, (_, i) => {
        const mes = String(i + 1).padStart(2, "0");
        return Number(`${year}${mes}`);
      });
      // Converte rows em mapa para preencher buracos
      const byKey = new Map(rows.map((r) => [Number(r.anomes), r]));
      const completed = skeleton.map((anomes) => {
        const base = byKey.get(anomes);
        if (base) return base;
        // Se preferencia filtrada, retorne colunas daquela preferência
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