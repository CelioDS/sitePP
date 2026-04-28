import { neonDB } from "../DataBase/neonDatabase.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

// ------------------ LOGIN NEON (POSTGRES) -------------------

// GET: lista todos
export const getDBLoginNeon = async (_, res) => {
  try {
    const query = "SELECT * FROM usuariosagen";
    const result = await neonDB.query(query); // Postgres retorna objeto

    return res.status(200).json(result.rows); // Dados em .rows
  } catch (err) {
    console.error("Erro getDBLoginNeon:", err);
    return res.status(500).json({ error: "Erro ao buscar usuários no Neon." });
  }
};

// GET: busca por ID
export const getDBLoginIDNeon = async (req, res) => {
  try {
    const query = "SELECT * FROM usuariosagen WHERE id = $1"; // $1 em vez de ?
    const result = await neonDB.query(query, [req.params.id]);
    
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error("Erro getDBLoginIDNeon:", err);
    return res.status(500).json({ error: "Erro ao buscar usuário por ID no Neon." });
  }
};

// POST: cria usuário
export const setDBLoginNeon = async (req, res) => {
  try {
    const { login, nome, senha, canal, mis, admin, mis_admin, ultimo_acesso, ocultar } = req.body;

    if (!login || !senha || canal === undefined || admin === undefined) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    // No Postgres, colunas com letras maiúsculas devem estar entre aspas duplas "" se criadas assim
    // E os valores usam $1, $2, $3...
    const query = `
      INSERT INTO usuariosagen (login, nome, senha, canal, mis, admin, mis_admin, ultimo_acesso, ocultar)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;

    const values = [login, nome, hashedPassword, canal, mis, admin, mis_admin, ultimo_acesso, ocultar];

    const result = await neonDB.query(query, values);

    return res.status(201).json({
      id: result.rows[0].id, // RETURNING id nos dá o ID gerado na hora
      message: "Usuário criado no Neon",
    });
  } catch (err) {
    console.error("Erro setDBLoginNeon:", err);
    return res.status(500).json({ error: "Erro ao criar usuário no Neon." });
  }
};

// PUT: atualiza usuário
export const updateDBLoginNeon = async (req, res) => {
  try {
    const { login, nome, senha, canal, mis, admin, ultimo_acesso } = req.body;
    const { id } = req.params;

    let sql, params;

    if (senha) {
      const hashed = await bcrypt.hash(senha, 10);
      sql = `
        UPDATE usuariosagen
           SET login = $1, nome = $2, senha = $3, canal = $4, mis = $5, admin = $6, ultimo_acesso = $7
         WHERE id = $8
      `;
      params = [login, nome, hashed, canal, mis, admin, ultimo_acesso, id];
    } else {
      sql = `
        UPDATE usuariosagen
           SET login = $1, nome = $2, canal = $3, mis = $4, admin = $5, ultimo_acesso = $6
         WHERE id = $7
      `;
      params = [login, nome, canal, mis, admin, ultimo_acesso, id];
    }

    const result = await neonDB.query(sql, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    return res.status(200).json({ message: "Usuário atualizado no Neon" });
  } catch (err) {
    console.error("Erro updateDBLoginNeon:", err);
    return res.status(500).json({ error: "Erro ao atualizar usuário no Neon." });
  }
};

// DELETE: remove usuário
export const deleteDBLoginNeon = async (req, res) => {
  try {
    const { id } = req.params;
    const query = "DELETE FROM usuariosagen WHERE id = $1";
    const result = await neonDB.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    return res.status(200).json({ message: "Deletado do Neon" });
  } catch (err) {
    console.error("Erro deleteDBLoginNeon:", err);
    return res.status(500).json({ error: "Erro ao deletar usuário no Neon." });
  }
};



export const patchDBLoginNeon = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID não informado!" });
    }

    const allowed = [
      "login",
      "nome",
      "canal",
      "mis",
      "admin",
      "ultimo_acesso",
      "ocultar",
    ];

    const setClauses = [];
    const params = [];
    let placeholderCount = 1; // Contador para os placeholders ($1, $2...)

    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        // No Postgres, removemos as crases (`) e usamos aspas duplas (") se necessário, 
        // ou apenas o nome da coluna se for minúsculo.
        setClauses.push(`${key} = $${placeholderCount}`);
        params.push(req.body[key]);
        placeholderCount++;
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ 
        error: "Nenhum campo válido para atualizar!" 
      });
    }

    // O ID será o último parâmetro na ordem do array params
    const sql = `
      UPDATE usuariosagen
      SET ${setClauses.join(", ")}
      WHERE id = $${placeholderCount}
    `;
    
    params.push(id);

    const result = await neonDB.query(sql, params);

    // No Postgres usamos rowCount em vez de affectedRows
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Usuário não encontrado no Neon!" });
    }

    return res.status(200).json({ data: "Último acesso ok (Neon)" });
  } catch (err) {
    console.error("❌ Erro patchDBLoginNeon:", err.message);
    return res.status(500).json({ error: "Erro ao atualizar via Patch no Neon" });
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
