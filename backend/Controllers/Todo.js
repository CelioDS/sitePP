import { dataBase } from "../DataBase/dataBase.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

// ------------------tarefas-------------------

// GET: lista todos
export const getDBtarefas = async (_, res) => {
  try {
    const query = "SELECT * FROM tarefas";
    const [rows] = await dataBase.query(query);
    return res.status(200).json(rows);
  } catch (err) {
    console.error("Erro getDBtarefas:", err);
    return res.status(500).json({ error: "Erro ao buscar usuários." });
  }
};

export const getDBtarefasID = async (req, res) => {
  try {
    const query = "SELECT * FROM tarefas WHERE id = ?";
    const [rows] = await dataBase.query(query, [req.params.id]);
    return res.status(200).json(rows);
  } catch (err) {
    console.error("Erro getDBtarefasID:", err);
    return res.status(500).json({ error: "Erro ao buscar usuário por ID." });
  }
};

// POST: cria usuário
export const setDBtarefas = async (req, res) => {
  try {
    const { tarefas, senha, canal, mis, admin } = req.body;

    if (!tarefas || !senha || canal === undefined || admin === undefined) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    const query = `
      INSERT INTO tarefas (\`tarefas\`, \`senha\`, \`canal\`, \`mis\`, \`admin\`)
      VALUES (?, ?, ?, ?, ?)
    `;

    // ⚠️ Ordem corrigida: tarefas, senha, canal, mis, admin
    const values = [tarefas, hashedPassword, canal, mis, admin];

    const [result] = await dataBase.query(query, values);

    return res
      .status(201)
      .json({ id: result.insertId, message: "Usuario criado" });
  } catch (err) {
    console.error("Erro setDBtarefas:", err);
    return res.status(500).json({ error: "Erro ao criar usuário." });
  }
};

// PUT: atualiza usuário
export const updateDBtarefas = async (req, res) => {
  try {
    const { tarefas, senha, canal, mis, admin } = req.body;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID não informado." });
    }
    if (!tarefas || canal === undefined || admin === undefined) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }

    // Se senha vier informada, hasheia; se vier vazia/undefined, não altera senha
    let sql, params;

    if (senha) {
      const hashed = await bcrypt.hash(senha, 10);
      sql = `
        UPDATE tarefas
           SET \`tarefas\` = ?, \`senha\` = ?, \`canal\` = ?, \`mis\` = ?, \`admin\` = ?
         WHERE \`id\` = ?
      `;
      params = [tarefas, hashed, canal, mis, admin, id];
    } else {
      sql = `
        UPDATE tarefas
           SET \`tarefas\` = ?, \`canal\` = ?, \`mis\` = ?, \`admin\` = ?
         WHERE \`id\` = ?
      `;
      params = [tarefas, canal, mis, admin, id];
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
    console.error("Erro updateDBtarefas:", err);
    return res.status(500).json({ error: "Erro ao atualizar usuário." });
  }
};

// DELETE: remove usuário
export const deleteDBtarefas = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "ID não informado." });

    const query = "DELETE FROM tarefas WHERE `id` = ?";
    const [result] = await dataBase.query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    return res.status(200).json({ message: "deletado" });
  } catch (err) {
    console.error("Erro deleteDBtarefas:", err);
    return res.status(500).json({ error: "Erro ao deletar usuário." });
  }
};
``;
