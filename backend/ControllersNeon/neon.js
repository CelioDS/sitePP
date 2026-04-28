import { neonDB } from "../DataBase/neonDatabase.js";
import { dataBase } from "../DataBase/dataBase.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import axios from "axios";
import * as cheerio from "cheerio";

dotenv.config();

// --------------------- funciton

function brDateTime(data) {
  if (!data) return null;

  const [datePart, timePart] = data.split(", ");
  const [day, month, year] = datePart.split("/");

  return `${year}-${month}-${day} ${timePart}`;
}

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
export const importarCotasCop = async (req, res) => {
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
      return res
        .status(404)
        .json({ error: "Nenhum registro local encontrado." });
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
        brDateTime(r.data_ref), // ✅ SEM brDateTime
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

    return res.json({
      message: "Último lote sincronizado com sucesso no Neon",
      data_coleta: rows[0].data_coleta,
      total: rows.length,
    });
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
