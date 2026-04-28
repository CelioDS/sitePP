import axios from "axios";
import * as cheerio from "cheerio";
import { dataBase } from "../DataBase/dataBase.js";
import { dataBaseNeon } from "../DataBase/neonDatabase.js"; 

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

export const importarCotasCop = async (req, res) => {
  try {
    const { data_ref } = req.body || {};
    console.log("IMPORTANDO COTAS COP | FILTRO: INTERIOR + CLASSE1");

    const dataColeta = new Date().toISOString().slice(0, 19).replace("T", " ");

    const response = await axios.get(
      "http://10.35.0.39/painelocupacaocop/inicio",
      {
        headers: {
          Cookie: "JSESSIONID=xxxx",
        },
      },
    );

    const payload = JSON.parse(response.data);

    if (!payload?.tableBody) {
      return res.status(500).json({ error: "Resposta inválida do painel COP" });
    }

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

      if (
        !regional.toUpperCase().includes("INTERIOR") ||
        classe.toUpperCase() !== "CLASSE1"
      ) {
        return;
      }

      let index = 5;
      let diaSeq = 0;

      while (index + 4 < cols.length) {
        const cotaAgenda = Number(cols[index]) || 0;
        const cotaDisp = Number(cols[index + 1]) || 0;
        const qtdOs = Number(cols[index + 2]) || 0;
        const saldo = Number(cols[index + 3]) || 0;
        const ocupPct = Number(cols[index + 4].replace("%", "")) || 0;

        if (cotaAgenda > 0 || qtdOs > 0) {
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
      return res.status(400).json({
        error: "Nenhum registro encontrado para INTERIOR + CLASSE1",
      });
    }

    // ===============================
    // 3️⃣ GRAVAÇÃO NO BANCO LOCAL
    // ===============================
    if (dataBase.beginTransaction) {
      await dataBase.beginTransaction();
    }

    const querySql = `
        INSERT INTO cop_ocupacao 
        (data_coleta, data_ref, regional, cluster, cidade, mercado, classe, dia, cota_agenda, cota_disp_est, qtd_os, saldo, taxa_ocupacao)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          cota_agenda   = VALUES(cota_agenda),
          cota_disp_est = VALUES(cota_disp_est),
          qtd_os        = VALUES(qtd_os),
          saldo         = VALUES(saldo),
          taxa_ocupacao = VALUES(taxa_ocupacao)
    `;

    for (const r of registros) {
      await dataBase.query(querySql, [
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
      ]);
    }

    // ===============================
    // 🆕 GRAVAÇÃO NO NEON (APENAS 1 REGISTRO)
    // ===============================
    // Limpamos o Neon para manter apenas a carga atual
    await dataBaseNeon.query("DELETE FROM cop_ocupacao");

    for (const r of registros) {
      // No Neon usamos INSERT simples sem o ON DUPLICATE pois a tabela foi limpa acima
      await dataBaseNeon.query(
        `
        INSERT INTO cop_ocupacao 
        (data_coleta, data_ref, regional, cluster, cidade, mercado, classe, dia, cota_agenda, cota_disp_est, qtd_os, saldo, taxa_ocupacao)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

    // ===============================
    // UPDATE DE BACKLOG / AGENDA
    // ===============================
    const queryBacklog = `
      UPDATE cop_ocupacao a
      LEFT JOIN (
        SELECT
            TRIM(p.cidades_bucket) AS cidade,
            p.DDD, p.subcluster, p.território AS territorio, p.escala_técnica AS escala_tecnica,
            SUM(p.QTD) AS QTD_BACKLOG,
            SUM(CASE WHEN p.grupo_agenda = 'AGENDA FUTURA' THEN p.QTD ELSE 0 END) AS agenda_futura,
            SUM(CASE WHEN p.grupo_agenda = 'SEM AGENDA' THEN p.QTD ELSE 0 END) AS sem_agenda,
            SUM(CASE WHEN p.grupo_agenda = 'ROTA' THEN p.QTD ELSE 0 END) AS rota
        FROM tbl_backlog_painel p
        WHERE p.data = (SELECT MAX(x.data) FROM tbl_backlog_painel x)
        GROUP BY TRIM(p.cidades_bucket), p.DDD, p.subcluster, p.território, p.escala_técnica
      ) b ON TRIM(a.cidade) = b.cidade
      SET
          a.ddd = b.DDD, a.subcluster = b.subcluster, a.territorio = b.territorio,
          a.escala_tecnica = b.escala_tecnica, a.qtd = b.QTD_BACKLOG,
          a.sem_agenda = b.sem_agenda, a.agenda_futura = b.agenda_futura, a.rota = b.rota;
    `;

    await dataBase.query(queryBacklog);
    await dataBaseNeon.query(queryBacklog); // Backlog no Neon também

    if (dataBase.commit) {
      await dataBase.commit();
    }

    return res.json({
      message: "Importação concluída local e online",
      total_registros: registros.length,
    });
  } catch (err) {
    if (dataBase.rollback) {
      await dataBase.rollback();
    }
    console.error("Erro importarCotasCop:", err);
    return res.status(500).json({ error: err.message });
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

    const [rows] = await dataBaseNeon.query(sql, params);

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
