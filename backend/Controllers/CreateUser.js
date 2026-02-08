import { dataBase } from "../DataBase/dataBase.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

// ------------------LOGIN-------------------

// GET: lista todos
export const getDBLogin = async (_, res) => {
  try {
    const query = "SELECT * FROM usuariosAgen";
    const [rows] = await dataBase.query(query);
    return res.status(200).json(rows);
  } catch (err) {
    console.error("Erro getDBLogin:", err);
    return res.status(500).json({ error: "Erro ao buscar usuários." });
  }
};

export const getDBLoginID = async (req, res) => {
  try {
    const query = "SELECT * FROM usuariosAgen WHERE id = ?";
    const [rows] = await dataBase.query(query, [req.params.id]);
    return res.status(200).json(rows);
  } catch (err) {
    console.error("Erro getDBLoginID:", err);
    return res.status(500).json({ error: "Erro ao buscar usuário por ID." });
  }
};

// POST: cria usuário
export const setDBLogin = async (req, res) => {
  try {
    const { login, senha, canal, admin } = req.body;

    if (!login || !senha || canal === undefined || admin === undefined) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    const query = `
      INSERT INTO usuariosAgen (\`login\`, \`senha\`, \`canal\`, \`admin\`)
      VALUES (?, ?, ?, ?)
    `;

    // ⚠️ Ordem corrigida: login, senha, canal, admin
    const values = [login, hashedPassword, canal, admin];

    const [result] = await dataBase.query(query, values);

    return res
      .status(201)
      .json({ id: result.insertId, message: "Usuario criado" });
  } catch (err) {
    console.error("Erro setDBLogin:", err);
    return res.status(500).json({ error: "Erro ao criar usuário." });
  }
};

// PUT: atualiza usuário
export const updateDBLogin = async (req, res) => {
  try {
    const { login, senha, canal, admin } = req.body;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID não informado." });
    }
    if (!login || canal === undefined || admin === undefined) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }

    // Se senha vier informada, hasheia; se vier vazia/undefined, não altera senha
    let sql, params;

    if (senha) {
      const hashed = await bcrypt.hash(senha, 10);
      sql = `
        UPDATE usuariosAgen
           SET \`login\` = ?, \`senha\` = ?, \`canal\` = ?, \`admin\` = ?
         WHERE \`id\` = ?
      `;
      params = [login, hashed, canal, admin, id];
    } else {
      sql = `
        UPDATE usuariosAgen
           SET \`login\` = ?, \`canal\` = ?, \`admin\` = ?
         WHERE \`id\` = ?
      `;
      params = [login, canal, admin, id];
    }

    const [result] = await dataBase.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    return res.status(200).json({
      message: "usuario atualizado",
      affectedRows: result.affectedRows,
      changedRows: result.changedRows ?? undefined,
    });
  } catch (err) {
    console.error("Erro updateDBLogin:", err);
    return res.status(500).json({ error: "Erro ao atualizar usuário." });
  }
};

// DELETE: remove usuário
export const deleteDBLogin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "ID não informado." });

    const query = "DELETE FROM usuariosAgen WHERE `id` = ?";
    const [result] = await dataBase.query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    return res.status(200).json({ message: "deletado" });
  } catch (err) {
    console.error("Erro deleteDBLogin:", err);
    return res.status(500).json({ error: "Erro ao deletar usuário." });
  }
};
``;
