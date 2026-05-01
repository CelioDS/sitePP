import { neonDB } from "../DataBase/neonDatabase.js";
import { dataBase } from "../DataBase/dataBase.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import axios from "axios";
import * as cheerio from "cheerio";

dotenv.config();

// ------------------ LOGIN NEON (POSTGRES) -------------------

export const getDBLoginNeon = async (_, res) => {
  try {
    const query = "SELECT * FROM usuariosagen";
    const result = await neonDB.query(query);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error("Erro getDBLoginNeon:", err);
    return res.status(500).json({ error: "Erro ao buscar usuários no Neon." });
  }
};

export const getDBLoginIDNeon = async (req, res) => {
  try {
    const query = "SELECT * FROM usuariosagen WHERE id = $1";
    const result = await neonDB.query(query, [req.params.id]);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error("Erro getDBLoginIDNeon:", err);
    return res
      .status(500)
      .json({ error: "Erro ao buscar usuário por ID no Neon." });
  }
};

export const setDBLoginNeon = async (req, res) => {
  try {
    const {
      login,
      nome,
      senha,
      canal,
      mis,
      admin,
      mis_admin,
      ultimo_acesso,
      ocultar,
    } = req.body;
    if (!login || !senha || canal === undefined || admin === undefined) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }
    const hashedPassword = await bcrypt.hash(senha, 10);
    const query = `
      INSERT INTO usuariosagen (login, nome, senha, canal, mis, admin, mis_admin, ultimo_acesso, ocultar)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;
    const values = [
      login,
      nome,
      hashedPassword,
      canal,
      mis,
      admin,
      mis_admin,
      ultimo_acesso,
      ocultar,
    ];
    const result = await neonDB.query(query, values);
    return res
      .status(201)
      .json({ id: result.rows[0].id, message: "Usuário criado no Neon" });
  } catch (err) {
    console.error("Erro setDBLoginNeon:", err);
    return res.status(500).json({ error: "Erro ao criar usuário no Neon." });
  }
};

export const updateDBLoginNeon = async (req, res) => {
  try {
    const { login, nome, senha, canal, mis, admin, ultimo_acesso } = req.body;
    const { id } = req.params;
    let sql, params;

    if (senha) {
      const hashed = await bcrypt.hash(senha, 10);
      sql = `UPDATE usuariosagen SET login = $1, nome = $2, senha = $3, canal = $4, mis = $5, admin = $6, ultimo_acesso = $7 WHERE id = $8`;
      params = [login, nome, hashed, canal, mis, admin, ultimo_acesso, id];
    } else {
      sql = `UPDATE usuariosagen SET login = $1, nome = $2, canal = $3, mis = $4, admin = $5, ultimo_acesso = $6 WHERE id = $7`;
      params = [login, nome, canal, mis, admin, ultimo_acesso, id];
    }

    const result = await neonDB.query(sql, params);
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Usuário não encontrado." });
    return res.status(200).json({ message: "Usuário atualizado no Neon" });
  } catch (err) {
    console.error("Erro updateDBLoginNeon:", err);
    return res
      .status(500)
      .json({ error: "Erro ao atualizar usuário no Neon." });
  }
};

export const deleteDBLoginNeon = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await neonDB.query(
      "DELETE FROM usuariosagen WHERE id = $1",
      [id],
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Usuário não encontrado." });
    return res.status(200).json({ message: "Deletado do Neon" });
  } catch (err) {
    console.error("Erro deleteDBLoginNeon:", err);
    return res.status(500).json({ error: "Erro ao deletar usuário no Neon." });
  }
};

export const patchDBLoginNeon = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "ID não informado!" });

    const allowed = [
      "login",
      "nome",
      "canal",
      "mis",
      "admin",
      "ultimo_acesso",
      "ocultar",
      "regional",
    ];
    const setClauses = [];
    const params = [];
    let placeholderCount = 1;

    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        setClauses.push(`${key} = $${placeholderCount}`);
        params.push(req.body[key]);
        placeholderCount++;
      }
    }

    if (setClauses.length === 0)
      return res
        .status(400)
        .json({ error: "Nenhum campo válido para atualizar!" });

    const sql = `UPDATE usuariosagen SET ${setClauses.join(", ")} WHERE id = $${placeholderCount}`;
    params.push(id);
    const result = await neonDB.query(sql, params);

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Usuário não encontrado no Neon!" });
    return res.status(200).json({ data: "Último acesso ok (Neon)" });
  } catch (err) {
    console.error("❌ Erro patchDBLoginNeon:", err.message);
    return res
      .status(500)
      .json({ error: "Erro ao atualizar via Patch no Neon" });
  }
};

// ------------------ IMPORTAÇÃO COTAS (POSTGRES) -------------------
export const importarCotasCopNeon = async (req = {}, res = null) => {
  try {
    const queryUltimoLote = `
      SELECT *
      FROM cop_ocupacao
      WHERE data_coleta = (
        SELECT MAX(data_coleta)
        FROM cop_ocupacao
      )
    `;

    const [rows] = await dataBase.query(queryUltimoLote);

    console.log("Linhas encontradas:", rows.length);

    if (rows.length === 0) {
      if (res) {
        return res
          .status(404)
          .json({ error: "Nenhum registro local encontrado." });
      }
    }

    // ⚠️ Início da transação para evitar carga parcial
    await neonDB.query("BEGIN");

    // Limpa tabela no Neon
    await neonDB.query("TRUNCATE cop_ocupacao");

    const queryInsertNeon = `
      INSERT INTO cop_ocupacao (
        data_ref, regional, cluster, cidade, mercado, classe,
        cota_agenda, cota_disp_est, taxa_ocupacao,
        data_coleta, dia, qtd_os, saldo, qtd, ddd,
        escala_tecnica, subcluster, territorio,
        sem_agenda, agenda_futura, rota
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,
        $10,$11,$12,$13,$14,$15,
        $16,$17,$18,
        $19,$20,$21
      )
    `;

    for (const r of rows) {
      await neonDB.query(queryInsertNeon, [
        r.data_ref, // ✅ SEM brDateTime
        r.regional,
        r.cluster,
        r.cidade,
        r.mercado,
        r.classe,
        r.cota_agenda,
        r.cota_disp_est,
        r.taxa_ocupacao,
        r.data_coleta, // ✅ SEM conversão
        r.dia,
        r.qtd_os,
        r.saldo,
        r.qtd,
        r.ddd,
        r.escala_tecnica,
        r.subcluster,
        r.territorio,
        r.sem_agenda,
        r.agenda_futura,
        r.rota,
      ]);
    }

    // Confirma carga
    await neonDB.query("COMMIT");
    if (res) {
      return res.json({
        message: "Último lote sincronizado com sucesso no Neon",
        data_coleta: rows[0].data_coleta,
        total: rows.length,
      });
    }
  } catch (err) {
    await neonDB.query("ROLLBACK");
    console.error("Erro ao subir dados para o Neon:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const getCotasCop = async (req, res) => {
  try {
    let {
      q,
      limit = 10000,
      offset = 0,
      orderBy = "id",
      orderDir = "DESC",
    } = req.query;

    limit = Math.min(Number(limit) || 10000, 200000);
    offset = Number(offset) || 0;
    orderDir = orderDir.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const params = [];
    let whereClause = "";

    if (q) {
      whereClause = `WHERE (c.cluster ILIKE $1 OR c.cidade ILIKE $1 OR c.mercado ILIKE $1 OR c.classe ILIKE $1)`;
      params.push(`%${q}%`);
    }

    const sql = `
     WITH data_max AS (
        SELECT MAX(data_coleta) AS data_coleta_max FROM cop_ocupacao
      )
      SELECT c.*
      FROM cop_ocupacao c
      JOIN data_max d ON c.data_coleta = d.data_coleta_max
      ${whereClause}
      ORDER BY c.${orderBy} ${orderDir}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      
    `;

    params.push(limit, offset);
    const result = await neonDB.query(sql, params);
    const rows = result.rows;

    const resultado = {};
    rows.forEach((r) => {
      if (!resultado[r.cidade]) {
        resultado[r.cidade] = {
          data_ref: r.data_ref,
          regional: r.regional,
          cluster: r.cluster,
          cidade: r.cidade,
          mercado: r.mercado,
          sem_agenda: r.sem_agenda,
          agenda_futura: r.agenda_futura,
          rota: r.rota,
          classe: r.classe,
          subcluster: r.subcluster,
          escala_tecnica: r.escala_tecnica,
          territorio: r.territorio,
          ddd: r.ddd,
          qtd: r.qtd,
          dias: {},
        };
      }
      resultado[r.cidade].dias[r.dia] = {
        cota_agenda: r.cota_agenda,
        cota_disp_est: r.cota_disp_est,
        qtd_os: r.qtd_os,
        saldo: r.saldo,
        taxa_ocupacao: r.taxa_ocupacao,
      };
    });

    // Ordenação dos dias
    Object.values(resultado).forEach((cidadeObj) => {
      cidadeObj.dias = Object.fromEntries(
        Object.entries(cidadeObj.dias).sort(
          ([a], [b]) => Number(a.replace("D", "")) - Number(b.replace("D", "")),
        ),
      );
    });

    return res.status(200).json(resultado);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Erro ao buscar cop_ocupacao no Neon" });
  }
};



/* =========================================================
   GET PDU – RESUMO MENSAL (INST / VB)
   ========================================================= */
   export const getPDU = async (req, res) => {
  try {
    const { refDate, year, referencia, movel } = req.query;

    const params = [];
    const joinFilters = [];

    /* =====================================================
       REFERENCIA (BR / SP_INT / tolerância a acento)
       ===================================================== */
    if (referencia) {
      const key = referencia.toUpperCase().trim();
      if (key === "BR" || key === "BRASIL") {
        joinFilters.push(`p.ref_norm = 'BRASIL'`);
      } else {
        joinFilters.push(`p.ref_norm ~ '^S.?O PAULO INTERIOR$'`);
      }
    }

    /* =====================================================
       MOVEL (true / false)
       ===================================================== */
    if (typeof movel !== "undefined") {
      const v = String(movel).toLowerCase();
      if (["1", "true", "movel", "móvel"].includes(v)) {
        joinFilters.push(`ROUND(p.movel::numeric,0) = 1`);
      }
      if (["0", "false", "fixo"].includes(v)) {
        joinFilters.push(`ROUND(p.movel::numeric,0) = 0`);
      }
    }

    const joinExtra =
      joinFilters.length > 0 ? `AND ${joinFilters.join(" AND ")}` : "";

    /* =====================================================
       DATA BASE (refDate / year / hoje)
       ===================================================== */
    let baseDateExpr;
    if (refDate) {
      baseDateExpr = `$1::date`;
      params.push(refDate);
    } else if (year) {
      baseDateExpr = `MAKE_DATE($1::int, EXTRACT(MONTH FROM CURRENT_DATE)::int, 1)`;
      params.push(Number(year));
    } else {
      baseDateExpr = `(CURRENT_DATE AT TIME ZONE 'America/Sao_Paulo')::date`;
    }

    const sql = `
      WITH base AS (
        SELECT ${baseDateExpr} AS today_eff
      ),
      ranges AS (
        SELECT
          today_eff,

          date_trunc('month', today_eff)::date AS first_day_cur,
          (date_trunc('month', today_eff) + interval '1 month - 1 day')::date AS last_day_cur,

          date_trunc('month', today_eff - interval '1 month')::date AS first_day_prev,
          (date_trunc('month', today_eff - interval '1 month') + interval '1 month - 1 day')::date AS last_day_prev,

          date_trunc('month', today_eff + interval '1 month')::date AS first_day_next,
          (date_trunc('month', today_eff + interval '1 month') + interval '1 month - 1 day')::date AS last_day_next,

          date_trunc('month', today_eff - interval '1 year')::date AS first_day_ly,
          (date_trunc('month', today_eff - interval '1 year') + interval '1 month - 1 day')::date AS last_day_ly
        FROM base
      )
      SELECT
        r.today_eff AS data_referencia,

        EXTRACT(DAY FROM r.last_day_cur) AS dias_no_mes,
        (r.today_eff - r.first_day_cur + 1) AS dias_passados,
        GREATEST(
          EXTRACT(DAY FROM r.last_day_cur) - (r.today_eff - r.first_day_cur + 1),
          0
        ) AS dias_restantes,

        ROUND(
          CAST(100.0 * (r.today_eff - r.first_day_cur + 1)
          / EXTRACT(DAY FROM r.last_day_cur) AS NUMERIC),
          2
        ) AS perc_mes_transcorrido,

        /* ----- MÊS ATUAL / ANTERIOR / PRÓXIMO ----- */
        ROUND(CAST(SUM(CASE WHEN p.dt BETWEEN r.first_day_cur AND r.last_day_cur THEN p.inst ELSE 0 END) AS NUMERIC),2) AS inst_mes_atual,
        ROUND(CAST(SUM(CASE WHEN p.dt BETWEEN r.first_day_prev AND r.last_day_prev THEN p.inst ELSE 0 END) AS NUMERIC),2) AS inst_mes_anterior,
        ROUND(CAST(SUM(CASE WHEN p.dt BETWEEN r.first_day_next AND r.last_day_next THEN p.inst ELSE 0 END) AS NUMERIC),2) AS inst_prox_mes,

        ROUND(CAST(SUM(CASE WHEN p.dt BETWEEN r.first_day_cur AND r.last_day_cur THEN p.vb ELSE 0 END) AS NUMERIC),2) AS vb_mes_atual,
        ROUND(CAST(SUM(CASE WHEN p.dt BETWEEN r.first_day_prev AND r.last_day_prev THEN p.vb ELSE 0 END) AS NUMERIC),2) AS vb_mes_anterior,
        ROUND(CAST(SUM(CASE WHEN p.dt BETWEEN r.first_day_next AND r.last_day_next THEN p.vb ELSE 0 END) AS NUMERIC),2) AS vb_prox_mes,

        /* ----- ACUMULADO ATÉ HOJE ----- */
        ROUND(CAST(SUM(CASE WHEN p.dt BETWEEN r.first_day_cur AND r.today_eff THEN p.inst ELSE 0 END) AS NUMERIC),2) AS inst_ate_hoje,
        ROUND(CAST(SUM(CASE WHEN p.dt BETWEEN r.first_day_cur AND r.today_eff THEN p.vb   ELSE 0 END) AS NUMERIC),2) AS vb_ate_hoje,

        /* ----- MESMO MÊS ANO PASSADO ----- */
        ROUND(CAST(SUM(CASE WHEN p.dt BETWEEN r.first_day_ly AND r.last_day_ly THEN p.inst ELSE 0 END) AS NUMERIC),2) AS inst_mes_ano_passado,
        ROUND(CAST(SUM(CASE WHEN p.dt BETWEEN r.first_day_ly AND r.last_day_ly THEN p.vb   ELSE 0 END) AS NUMERIC),2) AS vb_mes_ano_passado

      FROM ranges r
      LEFT JOIN (
        SELECT
          dt,
          inst,
          vb,
          COALESCE(movel,0) AS movel,
          UPPER(TRIM(referencia)) AS ref_norm
        FROM pdu
      ) p
        ON (
             (p.dt BETWEEN r.first_day_prev AND r.last_day_next)
             OR
             (p.dt BETWEEN r.first_day_ly AND r.last_day_ly)
           )
        ${joinExtra}
      GROUP BY
        r.today_eff,
        r.first_day_cur, r.last_day_cur,
        r.first_day_prev, r.last_day_prev,
        r.first_day_next, r.last_day_next,
        r.first_day_ly, r.last_day_ly;
    `;

    const { rows } = await neonDB.query(sql, params);
    return res.status(200).json(rows);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar PDU" });
  }
};


export const getPduFull = async (req, res) => {
  try {
    const { year, referencia } = req.query;

    /* ---------------- Validações ---------------- */
    const hasYear = !!year && /^\d{4}$/.test(String(year));
    const refKey = (referencia || "").toUpperCase().trim();

    const REF_MAP = {
      BR: "BRASIL",
      BRASIL: "BRASIL",
      SP_INT: "SÃO PAULO INTERIOR",
      "SÃO PAULO INTERIOR": "SÃO PAULO INTERIOR",
      "SAO PAULO INTERIOR": "SÃO PAULO INTERIOR",
      RSI: "SÃO PAULO INTERIOR",
    };

    const mappedRef = REF_MAP[refKey];

    /* ---------------- Filtros dinâmicos ---------------- */
    const params = [];
    const where = [];

    if (hasYear) {
      where.push(`p.aaaa_num = $${params.length + 1}`);
      params.push(Number(year));
    }

    let onlyOneRef = false;
    if (mappedRef) {
      onlyOneRef = true;
      if (mappedRef === "BRASIL") {
        where.push(`p.ref_norm = 'BRASIL'`);
      } else {
        where.push(`p.ref_norm ~ $${params.length + 1}`);
        params.push(`^S.?O PAULO INTERIOR$`);
      }
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    /* ---------------- Subselect normalizador ----------------
       ⬇️ Substitui CAST/REPLACE/SUBSTR do MySQL
       ⬇️ Usa dt (DATE) corretamente no PostgreSQL
    --------------------------------------------------------- */
    const baseSubselect = `
      SELECT
        (EXTRACT(YEAR FROM dt)::int * 100 + EXTRACT(MONTH FROM dt)::int) AS anomes_num,
        EXTRACT(YEAR FROM dt)::int                                     AS aaaa_num,
        UPPER(TRIM(referencia))                                       AS ref_norm,
        vb,
        inst
      FROM pdu
    `;

    /* ---------------- SELECT FINAL ---------------- */
    const selectSql = onlyOneRef
      ? `
        SELECT
          p.anomes_num AS anomes,
          ROUND(CAST(SUM(p.vb)   AS NUMERIC), 2) AS vb_soma,
          ROUND(CAST(SUM(p.inst) AS NUMERIC), 2) AS inst_soma
        FROM (${baseSubselect}) p
        ${whereSql}
        GROUP BY p.anomes_num
        ORDER BY p.anomes_num
      `
      : `
        SELECT
          p.anomes_num AS anomes,

          ROUND(CAST(SUM(CASE WHEN p.ref_norm = 'BRASIL' THEN p.vb ELSE 0 END) AS NUMERIC), 2) AS VB_soma_br,
          ROUND(CAST(SUM(CASE WHEN p.ref_norm ~ '^S.?O PAULO INTERIOR$' THEN p.vb ELSE 0 END) AS NUMERIC), 2) AS VB_soma_RSI,

          ROUND(CAST(SUM(CASE WHEN p.ref_norm = 'BRASIL' THEN p.inst ELSE 0 END) AS NUMERIC), 2) AS INST_soma_br,
          ROUND(CAST(SUM(CASE WHEN p.ref_norm ~ '^S.?O PAULO INTERIOR$' THEN p.inst ELSE 0 END) AS NUMERIC), 2) AS INST_soma_RSI
        FROM (${baseSubselect}) p
        ${whereSql}
        GROUP BY p.anomes_num
        ORDER BY p.anomes_num
      `;

    const { rows } = await neonDB.query(selectSql, params);

    /* ---------------- Esqueleto 12 meses ---------------- */
    if (hasYear) {
      const skeleton = Array.from({ length: 12 }, (_, i) =>
        Number(`${year}${String(i + 1).padStart(2, "0")}`)
      );

      const byKey = new Map(rows.map(r => [Number(r.anomes), r]));

      const completed = skeleton.map(anomes => {
        const base = byKey.get(anomes);
        if (base) return base;

        return onlyOneRef
          ? { anomes, vb_soma: 0, inst_soma: 0 }
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

    return res.status(200).json(rows);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar FULLBASE" });
  }
};

export const getPDUMovel = async (req, res) => {
  try {
    const { refDate, year } = req.query;

    const params = [];
    let baseDateExpr;

    // -------- Data base (equivalente ao MySQL) --------
    if (refDate) {
      baseDateExpr = `$1::date`;
      params.push(refDate);
    } else if (year && /^\d{4}$/.test(String(year))) {
      baseDateExpr = `
        MAKE_DATE(
          $1::int,
          EXTRACT(MONTH FROM (CURRENT_DATE AT TIME ZONE 'America/Sao_Paulo'))::int,
          1
        )
      `;
      params.push(Number(year));
    } else {
      baseDateExpr = `(CURRENT_DATE AT TIME ZONE 'America/Sao_Paulo')::date`;
    }

    const sql = `
      WITH base AS (
        SELECT ${baseDateExpr} AS today_eff
      ),
      ranges AS (
        SELECT
          today_eff,

          date_trunc('month', today_eff)::date AS first_day_cur,
          (date_trunc('month', today_eff) + interval '1 month - 1 day')::date AS last_day_cur,

          date_trunc('month', today_eff - interval '1 month')::date AS first_day_prev,
          (date_trunc('month', today_eff - interval '1 month') + interval '1 month - 1 day')::date AS last_day_prev,

          date_trunc('month', today_eff + interval '1 month')::date AS first_day_next,
          (date_trunc('month', today_eff + interval '1 month') + interval '1 month - 1 day')::date AS last_day_next,

          date_trunc('month', today_eff - interval '1 year')::date AS first_day_ly,
          (date_trunc('month', today_eff - interval '1 year') + interval '1 month - 1 day')::date AS last_day_ly
        FROM base
      )
      SELECT
        r.today_eff AS data_referencia,

        EXTRACT(DAY FROM r.last_day_cur) AS dias_no_mes,

        (r.today_eff - r.first_day_cur + 1) AS dias_passados,

        GREATEST(
          EXTRACT(DAY FROM r.last_day_cur)
          - (r.today_eff - r.first_day_cur + 1),
          0
        ) AS dias_restantes,

        ROUND(
          (100.0 * (r.today_eff - r.first_day_cur + 1)
          / EXTRACT(DAY FROM r.last_day_cur))::NUMERIC,
          2
        ) AS perc_mes_transcorrido,

        -- BRASIL
        ROUND(SUM(CASE
          WHEN p.dt BETWEEN r.first_day_cur AND r.last_day_cur
           AND p.referencia_norm = 'BRASIL'
          THEN p.movel ELSE 0 END)::NUMERIC,2) AS inst_mes_atual,

        -- SPI
        ROUND(SUM(CASE
          WHEN p.dt BETWEEN r.first_day_cur AND r.last_day_cur
           AND p.referencia_norm ~ '^S.?O PAULO INTERIOR$'
          THEN p.movel ELSE 0 END)::NUMERIC,2) AS vb_mes_atual

      FROM ranges r
      LEFT JOIN (
        SELECT
          dt,
          COALESCE(movel,0) AS movel,
          UPPER(TRIM(REPLACE(referencia, E'\\r',''))) AS referencia_norm
        FROM pdu
        WHERE dt IS NOT NULL
      ) p
        ON p.dt BETWEEN r.first_day_prev AND r.last_day_next
      GROUP BY
        r.today_eff,
        r.first_day_cur,
        r.last_day_cur;
    `;

    const { rows } = await neonDB.query(sql, params);
    return res.json(rows);

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Erro ao buscar PDUMovel",
      detail: err.message
    });
  }
};
export const getPduFullGrafico = async (req, res) => {
  try {
    const { year, referencia } = req.query;

    if (!year || !/^\d{4}$/.test(String(year))) {
      return res.status(400).json({ error: "Parâmetro year é obrigatório (YYYY)" });
    }

    const refKey = (referencia || "").toUpperCase().trim();

    const REF_MAP = {
      BR: "BRASIL",
      BRASIL: "BRASIL",
      SP_INT: "SÃO PAULO INTERIOR",
      "SÃO PAULO INTERIOR": "SÃO PAULO INTERIOR",
      "SAO PAULO INTERIOR": "SÃO PAULO INTERIOR",
      RSI: "SÃO PAULO INTERIOR",
    };

    const mappedRef = REF_MAP[refKey];

    const params = [Number(year)];
    const where = [`EXTRACT(YEAR FROM dt) = $1`];

    let onlyOneRef = false;

    if (mappedRef) {
      onlyOneRef = true;
      if (mappedRef === "BRASIL") {
        where.push(`ref_norm = 'BRASIL'`);
      } else {
        where.push(`ref_norm ~ '^S.?O PAULO INTERIOR$'`);
      }
    }

    const whereSql = `WHERE ${where.join(" AND ")}`;

    const sql = onlyOneRef
      ? `
        SELECT
          (EXTRACT(YEAR FROM dt)::int * 100 + EXTRACT(MONTH FROM dt)::int) AS anomes,
          ROUND(SUM(vb)::NUMERIC, 2)    AS vb_soma,
          ROUND(SUM(inst)::NUMERIC, 2)  AS inst_soma,
          ROUND(SUM(COALESCE(movel,0))::NUMERIC, 2) AS movel_soma
        FROM (
          SELECT
            dt,
            vb,
            inst,
            COALESCE(movel,0) AS movel,
            UPPER(TRIM(REPLACE(referencia, E'\\r',''))) AS ref_norm
          FROM pdu
          WHERE dt IS NOT NULL
        ) p
        ${whereSql}
        GROUP BY anomes
        ORDER BY anomes;
      `
      : `
        SELECT
          (EXTRACT(YEAR FROM dt)::int * 100 + EXTRACT(MONTH FROM dt)::int) AS anomes,

          ROUND(SUM(CASE WHEN ref_norm = 'BRASIL'
               THEN vb ELSE 0 END)::NUMERIC, 2) AS vb_soma_br,

          ROUND(SUM(CASE WHEN ref_norm ~ '^S.?O PAULO INTERIOR$'
               THEN vb ELSE 0 END)::NUMERIC, 2) AS vb_soma_rsi,

          ROUND(SUM(CASE WHEN ref_norm = 'BRASIL'
               THEN inst ELSE 0 END)::NUMERIC, 2) AS inst_soma_br,

          ROUND(SUM(CASE WHEN ref_norm ~ '^S.?O PAULO INTERIOR$'
               THEN inst ELSE 0 END)::NUMERIC, 2) AS inst_soma_rsi,

          ROUND(SUM(CASE WHEN ref_norm = 'BRASIL'
               THEN movel ELSE 0 END)::NUMERIC, 2) AS movel_soma_br,

          ROUND(SUM(CASE WHEN ref_norm ~ '^S.?O PAULO INTERIOR$'
               THEN movel ELSE 0 END)::NUMERIC, 2) AS movel_soma_rsi
        FROM (
          SELECT
            dt,
            vb,
            inst,
            COALESCE(movel,0) AS movel,
            UPPER(TRIM(REPLACE(referencia, E'\\r',''))) AS ref_norm
          FROM pdu
          WHERE dt IS NOT NULL
        ) p
        ${whereSql}
        GROUP BY anomes
        ORDER BY anomes;
      `;

    const { rows } = await neonDB.query(sql, params);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Erro ao buscar FULLBASE",
      detalhamento: err.message,
    });
  }
};