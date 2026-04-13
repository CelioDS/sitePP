import axios from "axios";
import * as cheerio from "cheerio";
import { dataBase } from "../DataBase/dataBase.js";

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
export const importarCotasCop = async (req, res) => {
  try {
    const { data_ref } = req.body || {};
    console.log("IMPORTANDO COTAS COP | FILTRO: INTERIOR + CLASSE1");

    // ===============================
    // 1️⃣ BUSCA PAINEL COP
    // ===============================
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

        // ignora dias vazios
        if (cotaAgenda > 0 || qtdOs > 0) {
          registros.push({
            data_ref: data_ref || new Date(),
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
    // 3️⃣ GRAVAÇÃO NO BANCO
    // ===============================
    if (dataBase.beginTransaction) await dataBase.beginTransaction();

    for (const r of registros) {
      await dataBase.query(
        `
        INSERT INTO cop_ocupacao
        (data_ref, regional, cluster, cidade, mercado, classe, dia,
         cota_agenda, cota_disp_est, qtd_os, saldo, taxa_ocupacao)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          cota_agenda   = VALUES(cota_agenda),
          cota_disp_est = VALUES(cota_disp_est),
          qtd_os        = VALUES(qtd_os),
          saldo         = VALUES(saldo),
          taxa_ocupacao = VALUES(taxa_ocupacao)
        `,
        [
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

    if (dataBase.commit) await dataBase.commit();

    // ===============================
    // 4️⃣ RESPOSTA
    // ===============================
    return res.json({
      message: "Importação concluída",
      filtro: "Regional contém INTERIOR + CLASSE1",
      total_registros: registros.length,
      amostra: registros.slice(0, 5),
    });
  } catch (err) {
    if (dataBase.rollback) await dataBase.rollback();
    console.error("Erro importarCotasCop:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const getCotasCop = async (req, res) => {
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

    const validOrder = ["ID", "cluster", "cidade", "mercado"];
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
          cop_ocupacao.cluster LIKE ?
          OR cop_ocupacao.cidade LIKE ?
          OR cop_ocupacao.mercado LIKE ?
          OR cop_ocupacao.classe LIKE ?
        )
      `);
      params.push(like, like, like, like);
    }

    const sql = `
  SELECT cop_ocupacao.*
  FROM cop_ocupacao
  ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
  ORDER BY cop_ocupacao.${orderBy} ${orderDir}
  LIMIT ?, ?
`;

    params.push(offset, limit);

    const [rows] = await dataBase.query(sql, params);

    // ===============================
    // ✅ AGRUPAMENTO: Cidade → Dia
    // ===============================
    const resultado = {};

    rows.forEach((r) => {
      const cidade = r.cidade;
      const dia = r.dia;

      if (!resultado[cidade]) {
        resultado[cidade] = {
          regional: r.regional,
          cluster: r.cluster,
          cidade: r.cidade,
          mercado: r.mercado,
          classe: r.classe,
          dias: {},
        };
      }

      resultado[cidade].dias[dia] = {
        cota_agenda: r.cota_agenda,
        cota_disp_est: r.cota_disp_est,
        qtd_os: r.qtd_os,
        saldo: r.saldo,
        taxa_ocupacao: r.taxa_ocupacao,
      };

      // ✅ ORDENA OS DIAS (D1 → D2 → D3)
      // ===============================
      Object.values(resultado).forEach((cidadeObj) => {
        cidadeObj.dias = Object.fromEntries(
          Object.entries(cidadeObj.dias).sort(([diaA], [diaB]) => {
            const nA = Number(diaA.replace("D", ""));
            const nB = Number(diaB.replace("D", ""));
            return nA - nB;
          }),
        );
      });
    });

    return res.status(200).json(resultado);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar cop_ocupacao" });
  }
};
