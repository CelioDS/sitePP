import axios from "axios";
import * as cheerio from "cheerio";
import { dataBase } from "../DataBase/dataBase.js";
import dotenv from "dotenv";

dotenv.config();

const MAPA_TABELAS = {
  Cotas: "Cotas",
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

/**
 * Importa cotas do painel COP
 * Filtro: REGIONAL contendo "INTERIOR" + CLASSE1
 */

export const importarCotasCop = async (req = {}, res = null) => {
  try {
    const { data_ref } = req.body || {};
    console.log("IMPORTANDO COTAS COP | FILTRO: INTERIOR + CLASSE1");

    // ===============================
    // ✅ DATA ÚNICA DA COLETA (UMA POR EXECUÇÃO)
    // ===============================
    const dataColeta = new Date().toISOString().slice(0, 19).replace("T", " ");

    // ===============================
    // 1️⃣ BUSCA PAINEL COP
    // ===============================
    const response = await axios.get(`${process.env.BACKEND_URL_COP}/inicio`, {
      headers: {
        Cookie: "JSESSIONID=xxxx",
      },
    });

    const payload = JSON.parse(response.data);

    if (!payload?.tableBody) {
      if (res) {
        return res
          .status(500)
          .json({ error: "Resposta inválida do painel COP" });
      }
    }

    // ===============================
    // 2️⃣ HTML → OBJETOS LIMPOS
    // ===============================
    const $ = cheerio.load(`<table>${payload.tableBody}</table>`);
    const registros = [];

    $("tr").each((_, tr) => {
      const cols = $(tr)
        .find("td")
        .map((_, td) => $(td).text().trim())
        .get();

      if (cols.length < 10) return;

      const regional = cols[0].replace("Regional", "").trim();
      const cluster = cols[1];
      const cidade = cols[2];
      const mercado = cols[3];
      const classe = cols[4];

      // ===============================
      // ✅ FILTRO DE NEGÓCIO
      // ===============================
      if (
        !regional.toUpperCase().includes("INTERIOR") ||
        classe.toUpperCase() !== "CLASSE1"
      ) {
        return;
      }

      let index = 5;
      let diaSeq = 0;

      // Cada DIA = 5 colunas
      while (index + 4 < cols.length) {
        const cotaAgenda = Number(cols[index]) || 0;
        const cotaDisp = Number(cols[index + 1]) || 0;
        const qtdOs = Number(cols[index + 2]) || 0;
        const saldo = Number(cols[index + 3]) || 0;
        const ocupPct = Number(cols[index + 4].replace("%", "")) || 0;

        // Validar se existe valor
        if (cotaAgenda >= 0 || qtdOs >= 0) {
          registros.push({
            data_coleta: dataColeta,
            data_ref: payload.dtExport,
            regional,
            cluster,
            cidade,
            mercado,
            classe,
            dia: `D${diaSeq + 1}`,
            cota_agenda: cotaAgenda,
            cota_disp_est: cotaDisp,
            qtd_os: qtdOs,
            saldo,
            taxa_ocupacao: ocupPct,
          });
        }

        index += 5;
        diaSeq++;
      }
    });

    if (registros.length === 0) {
      if (res) {
        return res.status(400).json({
          error: "Nenhum registro encontrado para INTERIOR + CLASSE1",
        });
      }
    }

    // ===============================
    // 3️⃣ GRAVAÇÃO NO BANCO
    // ===============================
    if (dataBase.beginTransaction) {
      await dataBase.beginTransaction();
    }

    for (const r of registros) {
      await dataBase.query(
        `
        INSERT INTO cop_ocupacao
        (
          data_coleta,
          data_ref,
          regional,
          cluster,
          cidade,
          mercado,
          classe,
          dia,
          cota_agenda,
          cota_disp_est,
          qtd_os,
          saldo,
          taxa_ocupacao
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          cota_agenda   = VALUES(cota_agenda),
          cota_disp_est = VALUES(cota_disp_est),
          qtd_os        = VALUES(qtd_os),
          saldo         = VALUES(saldo),
          taxa_ocupacao = VALUES(taxa_ocupacao)
        `,
        [
          r.data_coleta,
          r.data_ref,
          r.regional,
          r.cluster,
          r.cidade,
          r.mercado,
          r.classe,
          r.dia,
          r.cota_agenda,
          r.cota_disp_est,
          r.qtd_os,
          r.saldo,
          r.taxa_ocupacao,
        ],
      );
    }

    // update de backlog / agenda

    await dataBase.query(`
  UPDATE cop_ocupacao a
LEFT JOIN (
    SELECT
        TRIM(p.cidades_bucket) AS cidade,
        p.DDD,
        p.subcluster,
        p.território     AS territorio,
        p.escala_técnica AS escala_tecnica,
        SUM(p.QTD) AS QTD_BACKLOG,
        SUM(CASE
            WHEN p.grupo_agenda = 'AGENDA FUTURA' THEN p.QTD
            ELSE 0
        END) AS agenda_futura,
        SUM(CASE
            WHEN p.grupo_agenda = 'SEM AGENDA' THEN p.QTD
            ELSE 0
        END) AS sem_agenda,
        SUM(CASE
            WHEN p.grupo_agenda = 'ROTA' THEN p.QTD
            ELSE 0
        END) AS rota
    FROM tbl_backlog_painel p
    WHERE p.data = (
        SELECT MAX(x.data)
        FROM tbl_backlog_painel x
    )
    GROUP BY
        TRIM(p.cidades_bucket),
        p.DDD,
        p.subcluster,
        p.território,
        p.escala_técnica
) b
    ON TRIM(a.cidade) = b.cidade
SET
    a.ddd            = b.DDD,
    a.subcluster     = b.subcluster,
    a.territorio     = b.territorio,
    a.escala_tecnica = b.escala_tecnica,
    a.qtd            = b.QTD_BACKLOG,
    a.sem_agenda     = b.sem_agenda,
    a.agenda_futura  = b.agenda_futura,
    a.rota  = b.rota;
      `);

    //resposta

    if (dataBase.commit) {
      await dataBase.commit();
    }

    // ===============================
    // 4️⃣ RESPOSTA
    // ===============================
    if (res) {
      return res.json({
        message: "Importação concluída",
        filtro: "Regional contém INTERIOR + CLASSE1",
        data_coleta: dataColeta,
        total_registros: registros.length,
        amostra: registros.slice(0, 5),
      });
    }
  } catch (err) {
    if (dataBase.rollback) {
      await dataBase.rollback();
    }
    console.error("Erro importarCotasCop:", err);

    if (res) {
      return res.status(500).json({ error: err.message });
    }
  }
};

export const importarCotasPeriodo = async (req = {}, res = null) => {
  try {
    const buckets = [
      "ADT_Todas_Areas_Desc_Inst_Manut_Mdu",
    ]

    const payload = {
      buckets,
      consulta: "online",
      classes: ["CLASSE1"],
    };

    const { data } = await axios.post("http://10.35.0.39/buckets", payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 50000,
    });

    const dados = typeof data === "string" ? JSON.parse(data) : data;
    const items = dados?.items || [];
    console.log(dados.data);
    const resultado = [];

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    for (const item of items) {
      for (const bucket of item?.buckets || []) {
        const cidade = bucket.label;

        for (const category of bucket?.categories || []) {
          if (category.label !== "CLASSE1") continue;

          for (const dateObj of category?.date || []) {
            const dataItem = new Date(dateObj.label);
            dataItem.setHours(0, 0, 0, 0);

            // diferença em dias (D1 = hoje)
            const diff = (dataItem.getTime() - hoje.getTime()) / 86400000;

            if (diff < 0 || diff > 16) continue;

            const dia = `D${Math.floor(diff) + 1}`;

            for (const timeSlot of dateObj?.timeSlot || []) {
              resultado.push([
                dateObj.label, // data_ref
                dia,
                dateObj.label, // data_dia
                cidade,
                timeSlot.label,
                timeSlot.bookedActivities || 0,
              ]);
            }
          }
        }
      }
    }

    // ✅ ordena corretamente D1, D2...
    resultado.sort((a, b) => {
      return Number(a[1].slice(1)) - Number(b[1].slice(1));
    });

    console.log("TOTAL:", resultado.length);

    if (!resultado.length) {
      return res?.json({ message: "⚠️ Nenhum dado encontrado" });
    }

    // ✅ INSERT EM LOTE (performance MUITO melhor)
    const CHUNK_SIZE = 2000;

    for (let i = 0; i < resultado.length; i += CHUNK_SIZE) {
      const chunk = resultado.slice(i, i + CHUNK_SIZE);

      const values = chunk.map(() => "(?, ?, ?, ?, ?, ?)").join(",");

      await dataBase.query(
        `
        INSERT INTO periodo (
          data_ref,
          dia,
          data_dia,
          cidade,
          periodo,
          cotas_periodo
        )
        VALUES ${values}
        ON DUPLICATE KEY UPDATE
          cotas_periodo = VALUES(cotas_periodo),
          dia = VALUES(dia)
        `,
        chunk.flat(),
      );
    }

    return res?.json({
      message: "✅ Importação concluída",
      total: resultado.length,
    });
  } catch (error) {
    console.error("❌ Erro:", error);

    return res?.status(500).json({
      erro: "Erro na importação",
      detalhe: error.message,
    });
  }
};

export const getCotasCop = async (req, res) => {
  try {
    let {
      q,
      limit = 200000,
      offset = 0,
      orderBy = "id",
      orderDir = "DESC",
    } = req.query;

    limit = Math.min(Number(limit) || 1000, 200000);
    offset = Number(offset) || 0;

    const validOrder = ["id", "cluster", "cidade", "mercado"];
    orderBy = validOrder.includes(orderBy) ? orderBy : "id";
    orderDir = orderDir.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const where = [];
    const params = [];

    // 🔍 Busca textual
    if (q) {
      const like = `%${q}%`;
      where.push(`
        (
          c.cluster LIKE ?
          OR c.cidade LIKE ?
          OR c.mercado LIKE ?
          OR c.classe LIKE ?
        )
      `);
      params.push(like, like, like, like);
    }

    const sql = `
      WITH data_max AS (
        SELECT MAX(data_coleta) AS data_coleta_max
        FROM cop_ocupacao
      )
      SELECT c.*
      FROM cop_ocupacao c
      JOIN data_max d
        ON c.data_coleta = d.data_coleta_max
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY c.${orderBy} ${orderDir}
      LIMIT ?, ?
    `;

    params.push(offset, limit);

    const [rows] = await dataBase.query(sql, params);

    // ===============================
    // ✅ AGRUPAMENTO: Cidade → Dia
    // ===============================
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
          classe: r.classe,
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

    // ✅ Ordena D1 → D2 → D3
    Object.values(resultado).forEach((cidadeObj) => {
      cidadeObj.dias = Object.fromEntries(
        Object.entries(cidadeObj.dias).sort(([a], [b]) => {
          const nA = Number(a.replace("D", ""));
          const nB = Number(b.replace("D", ""));
          return nA - nB;
        }),
      );
    });

    return res.status(200).json(resultado);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Erro ao buscar cop_ocupacao",
    });
  }
};

export const porcentagem_ocupacao = async (req, res) => {
  try {
    const query = `
 SELECT
    territorio, 
    sum(saldo) as cotas,
    sum(qtd_os) as agendamentos,
    CASE 
        WHEN dia = 'D1' THEN 'D0' 
        WHEN dia = 'D2' THEN 'D1' 
        ELSE dia 
    END AS dia,
    NULLIF(SUM(cota_disp_est)/ SUM(cota_agenda) , 0) * 100 AS taxa_perc
FROM cop_ocupacao
WHERE STR_TO_DATE(data_ref, '%d/%m/%Y, %H:%i:%s') = (

    -- ✅ pega o MAX do dia anterior ao último dia disponível
    SELECT MAX(dt)
    FROM (
        SELECT STR_TO_DATE(data_ref, '%d/%m/%Y, %H:%i:%s') AS dt
        FROM cop_ocupacao
    ) t
    WHERE DATE(dt) = (

        -- ✅ pega o último dia do banco - 1
        SELECT DATE(
            DATE_SUB(
                MAX(STR_TO_DATE(data_ref, '%d/%m/%Y, %H:%i:%s')),
                INTERVAL 1 DAY
            )
        )
        FROM cop_ocupacao

    )
)
AND dia IN ('D1', 'D2')
GROUP BY territorio, dia
ORDER BY territorio DESC, dia DESC;
    `;

    const [rows] = await dataBase.query(query);

    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Erro ao calcular porcentagem de ocupação",
    });
  }
};

export const porcentagem_ocupacao_cidades = async (req, res) => {
  try {
    const query = `
    SELECT
    cidade,
    territorio,
    ddd,
    sum(saldo) as cotas,
    sum(qtd_os) as agendamentos,
    CASE
        WHEN dia = 'D1' THEN 'D0'
        WHEN dia = 'D2' THEN 'D1'
        ELSE dia
    END AS dia,
    (SUM(cota_disp_est) / NULLIF(SUM(cota_agenda), 0)) * 100 AS taxa_perc

FROM cop_ocupacao

WHERE STR_TO_DATE(data_ref, '%d/%m/%Y, %H:%i:%s') = (

    -- ✅ pega o MAX do dia anterior ao último dia disponível
    SELECT MAX(dt)
    FROM (
        SELECT STR_TO_DATE(data_ref, '%d/%m/%Y, %H:%i:%s') AS dt
        FROM cop_ocupacao
    ) t
    WHERE DATE(dt) = (

        -- ✅ pega o último dia do banco - 1
        SELECT DATE(
            DATE_SUB(
                MAX(STR_TO_DATE(data_ref, '%d/%m/%Y, %H:%i:%s')),
                INTERVAL 1 DAY
            )
        )
        FROM cop_ocupacao

    )
)

AND dia IN ('D1', 'D2')
and cidade in ('ARACATUBA','BAURU','CAMPINAS', 'SOROCABA','SANTOS', 'MIRASSOL | SAO JOSE DO RIO PRETO', 'SAO JOSE DOS CAMPOS','RIBEIRAO PRETO')
GROUP BY cidade, territorio, dia
ORDER BY cidade DESC, territorio DESC, dia DESC;
    `;

    const [rows] = await dataBase.query(query);

    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Erro ao calcular porcentagem de ocupação",
    });
  }
};
