import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { dataBase } from "../DataBase/dataBase.js";

const TODAY = format(
  fromZonedTime(new Date(), "America/Sao_Paulo"),
  "yyyy-MM-dd HH:mm",
);

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
    const { tarefa, etapas, porcentagem, responsavel, concluido } = req.body;

    if (!tarefa || etapas === undefined || porcentagem === undefined) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }

    const query = `
      INSERT INTO tarefas (\`tarefa\`, \`etapas\`, \`porcentagem\`,\`responsavel\` ,\`concluido\`,\`data_atualizacao\`)
      VALUES (?, ?, ?, ? , ?, ?)
    `;

    const values = [tarefa, etapas, porcentagem, responsavel, concluido, TODAY];

    const [result] = await dataBase.query(query, values);

    return res.status(201).json({
      id: result.insertId,
      tarefa,
      etapas,
      porcentagem,
      responsavel,
      concluido,
      data_atualizacao: TODAY,
      message: "Tarefa criada",
    });
  } catch (err) {
    console.error("Erro setDBtarefas:", err);
    return res.status(500).json({ error: "Erro ao criar usuário." });
  }
};

// PUT: atualiza usuário
export const updateDBtarefas = async (req, res) => {
  try {
    const {
      tarefa,
      etapas,
      porcentagem,
      concluido,
      responsavel,
      DATA_ATUALIZACAO,
    } = req.body;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID não informado." });
    }
    if (!tarefa || etapas === undefined || porcentagem === undefined) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }

    // Se senha vier informada, hasheia; se vier vazia/undefined, não altera senha
    let sql, params;

    sql = `
        UPDATE tarefas
           SET \`tarefa\` = ?, \`etapas\` = ?, \`porcentagem\` = ?, \`concluido\` = ?, \`responsavel\` = ?, \`data_atualizacao\` = ?
         WHERE \`id\` = ?
      `;
    params = [tarefa, etapas, porcentagem, concluido, responsavel, TODAY, id];

    const [result] = await dataBase.query(sql, params);

    return res.status(200).json({
      id: result.insertId,
      tarefa,
      etapas,
      porcentagem,
      responsavel,
      concluido,
      data_atualizacao: TODAY,
      message: "Tarefa atualizada ...",
    });
  } catch (err) {
    console.error("Erro updateDBtarefas:", {
      message: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage,
      stack: err.stack,
    });
    return res.status(500).json({ error: "Erro ao atualizar usuário." });
  }
};

// DELETE: remove usuário
export const deleteDBtarefas = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "id não informado." });

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

/**************** ETAPAS TAREFAS*************************************/

export const updateDBtarefasEtapas = async (req, res) => {
  try {
    const { etapas, peso, status, concluido, md5, data_atualizacao } = req.body;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID não informado." });
    }
    if (
      !etapas ||
      peso === undefined ||
      status === undefined ||
      md5 === undefined ||
      data_atualizacao === undefined
    ) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }

    // Se senha vier informada, hasheia; se vier vazia/undefined, não altera senha
    let sql, params;

    sql = `
        UPDATE tarefasEtapas
           SET \`peso\` = ?, \`etapas\` = ?, \`status\` = ?, \`concluido\` = ?, \`md5\` = ?, \`data_atualizacao\` = ?
         WHERE \`id\` = ?
      `;
    params = [etapas, peso, status, concluido, md5, TODAY, id];

    const [result] = await dataBase.query(sql, params);

    return res.status(200).json({
      id: result.insertId,
      etapas,
      peso,
      status,
      concluido,
      md5,
      data_atualizacao: TODAY,
      message: "Tarefa atualizada ...",
    });
  } catch (err) {
    console.error("Erro updateDBtarefas:", {
      message: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage,
      stack: err.stack,
    });
    return res.status(500).json({ error: "Erro ao atualizar usuário." });
  }
};

// POST: cria usuário
export const setDBtarefasEtapas = async (req, res) => {
  try {
    const { etapas, peso, status, concluido, md5, data_atualizacao } = req.body;

    if (
      !etapas ||
      peso === undefined ||
      status === undefined ||
      md5 === undefined ||
      data_atualizacao === undefined
    ) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }

    const query = `
      INSERT INTO tarefas (\`etapas\`, \`peso\`, \`status\`,\`concluido\` ,\`md5\`,\`data_atualizacao\`)
      VALUES (?, ?, ?, ? , ?, ?)
    `;

    const values = [etapas, peso, status, concluido, md5, TODAY];

    const [result] = await dataBase.query(query, values);

    return res.status(201).json({
      id: result.insertId,
      etapas,
      peso,
      status,
      concluido,
      md5,
      data_atualizacao: TODAY,
      message: "Tarefa criada",
    });
  } catch (err) {
    console.error("Erro setDBtarefas:", err);
    return res.status(500).json({ error: "Erro ao criar usuário." });
  }
};
