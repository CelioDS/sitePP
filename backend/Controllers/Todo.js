import dotenv from "dotenv";
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
    // 1) Aumenta o limite do GROUP_CONCAT na sessão atual (query separado)
    await dataBase.query('SET SESSION group_concat_max_len = 1000000');

    // 2) Faz o SELECT (apenas uma instrução SQL aqui)
    const sql = `
      SELECT
        t.*,
        COALESCE((
          SELECT CONCAT(
            '[',
            GROUP_CONCAT(
              JSON_OBJECT(
                'tarefa_id',        e.tarefa_id,
                'etapas',           e.etapas,
                'peso',             e.peso,
                'status',           e.status,
                'concluido',        e.concluido,
                'data_atualizacao', DATE_FORMAT(e.data_atualizacao, '%Y-%m-%d %H:%i:%s'),
                'criado_em',        DATE_FORMAT(e.criado_em, '%Y-%m-%d %H:%i:%s')
              )
              ORDER BY e.criado_em
              SEPARATOR ','
            ),
            ']'
          )
          FROM tarefasetapas e
          WHERE e.tarefa_id = t.id
        ), '[]') AS etapas
      FROM tarefas t
    `;

    const [rows] = await dataBase.query(sql);

    // 3) Converte etapas (string JSON) -> array/obj
    const result = rows.map(r => ({
      ...r,
      etapas: typeof r.etapas === 'string' ? JSON.parse(r.etapas) : r.etapas
    }));

    return res.status(200).json(result);
  } catch (err) {
    console.error('Erro getDBtarefas:', err);
    return res.status(500).json({ error: 'Erro ao buscar tarefas.' });
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
    const { tarefa, responsavel, concluido } = req.body;

    if (!tarefa) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }

    const query = `
      INSERT INTO tarefas (\`tarefa\`,\`responsavel\` ,\`concluido\`,\`data_atualizacao\`)
      VALUES (?, ?, ?, ? )
    `;

    const values = [tarefa, responsavel, concluido, TODAY];

    const [result] = await dataBase.query(query, values);

    return res.status(201).json({
      id: result.insertId,
      tarefa,
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
    const { tarefa, concluido, responsavel, DATA_ATUALIZACAO } = req.body;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID não informado." });
    }
    if (!tarefa) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }

    // Se senha vier informada, hasheia; se vier vazia/undefined, não altera senha
    let sql, params;

    sql = `
        UPDATE tarefas
           SET \`tarefa\` = ?, \`concluido\` = ?, \`responsavel\` = ?, \`data_atualizacao\` = ?
         WHERE \`id\` = ?
      `;
    params = [tarefa, concluido, responsavel, TODAY, id];

    const [result] = await dataBase.query(sql, params);

    return res.status(200).json({
      id: result.insertId,
      tarefa,
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
// POST: cria usuário
export const setDBtarefasEtapas = async (req, res) => {
  try {
    const { tarefa_id, etapas, peso, status, concluido } = req.body;

    if (
      !etapas ||
      tarefa_id === undefined ||
      peso === undefined ||
      status === undefined ||
      concluido === undefined
    ) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }

    const query = `
      INSERT INTO tarefasetapas (\`tarefa_id\`,\`etapas\`, \`peso\`, \`status\`,\`concluido\`,\`data_atualizacao\` ,\`criado_em\`)
      VALUES (?, ?, ?, ? , ?, ?,?)
    `;

    const values = [tarefa_id, etapas, peso, status, concluido, TODAY, TODAY];

    const [result] = await dataBase.query(query, values);

    return res.status(201).json({
      id: result.insertId,
      tarefa_id,
      etapas,
      peso,
      status,
      concluido,
      data_atualizacao: TODAY,
      criado_em: TODAY,
      message: "Tarefa criada",
    });
  } catch (err) {
    console.error("Erro setDBtarefas:", err);
    return res.status(500).json({ error: "Erro ao criar usuário." });
  }
};

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
