import axios from "axios";
import * as cheerio from "cheerio";
import { dataBase } from "../DataBase/dataBase.js";

export async function importarCotasCopService() {
  console.log("IMPORTANDO COTAS COP | FILTRO: INTERIOR + CLASSE1");

  const dataColeta = new Date().toISOString().slice(0, 19).replace("T", " ");

  // ===============================
  // 1️⃣ BUSCA PAINEL COP
  // ===============================
  const response = await axios.get(
    "http://10.35.0.39/painelocupacaocop/inicio",
    {
      headers: {
        Cookie: "JSESSIONID=xxxx",
      },
    }
  );

  const payload = JSON.parse(response.data);

  if (!payload?.tableBody) {
    throw new Error("Resposta inválida do painel COP");
  }

  // ===============================
  // 2️⃣ HTML → OBJETOS
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
    throw new Error("Nenhum registro encontrado (INTERIOR + CLASSE1)");
  }

  // ===============================
  // 3️⃣ BANCO
  // ===============================
  await dataBase.beginTransaction();

  for (const r of registros) {
    await dataBase.query(
      `
      INSERT INTO cop_ocupacao (...)
      VALUES (...)
      ON DUPLICATE KEY UPDATE ...
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
      ]
    );
  }

  await dataBase.commit();

  return {
    data_coleta: dataColeta,
    total_registros: registros.length,
  };
}
