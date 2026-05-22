import { dataBase } from "../../DataBase/dataBase.js";
import dotenv from "dotenv";

dotenv.config();

// ✅ GET TODOS
export const getSuporteComercial = async (req, res) => {
  try {
    const query = `SELECT * FROM suporte_comercial`;

    const [rows] = await dataBase.query(query);

    return res.status(200).json(rows);
  } catch (err) {
    console.error("Erro getSuporteComercial:", err);

    return res.status(500).json({
      error: "Erro ao buscar Suporte comercial",
    });
  }
};

// ✅ GET POR ID
export const getSuporteComercialID = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `SELECT * FROM suporte_comercial WHERE id = ?`;

    const [rows] = await dataBase.query(query, [id]);

    return res.status(200).json(rows);
  } catch (err) {
    console.error("Erro getSuporteComercialID:", err);

    return res.status(500).json({
      error: "Erro ao buscar por ID",
    });
  }
};

// ✅ INSERT
export const setSuporteComercial = async (req, res) => {
  try {
    const { status_iw, status_solicitacao, observacao, anexo, responsavel } =
      req.body;

    const query = `
      INSERT INTO suporte_comercial 
      (status_iw, status_solicitacao, observacao, anexo, responsavel)
      VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
      status_iw,
      status_solicitacao,
      observacao,
      anexo,
      responsavel,
    ];

    const [result] = await dataBase.query(query, values);

    return res.status(201).json({
      id: result.insertId,
      msg: "Criado com sucesso ✅",
    });
  } catch (err) {
    console.error("Erro setSuporteComercial:", err);

    return res.status(500).json({
      error: "Erro ao inserir dados",
    });
  }
};

// ✅ UPDATE (PATCH)
export const patchSuporteComercial = async (req, res) => {
  try {
    const { id } = req.params;
    const { status_iw, status_solicitacao, observacao, anexo, responsavel } =
      req.body;

    const query = `
      UPDATE suporte_comercial 
      SET status_iw = ?, status_solicitacao = ?, observacao = ?, anexo = ?, responsavel = ?
      WHERE id = ?
    `;

    const values = [
      status_iw,
      status_solicitacao,
      observacao,
      anexo,
      responsavel,
      id,
    ];

    await dataBase.query(query, values);

    return res.status(200).json({
      msg: "Atualizado com sucesso ✅",
    });
  } catch (err) {
    console.error("Erro patchSuporteComercial:", err);

    return res.status(500).json({
      error: "Erro ao atualizar",
    });
  }
};

// ✅ DELETE
export const deleteSuporteComercial = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `DELETE FROM suporte_comercial WHERE id = ?`;

    await dataBase.query(query, [id]);

    return res.status(200).json({
      msg: "Deletado com sucesso ✅",
    });
  } catch (err) {
    console.error("Erro deleteSuporteComercial:", err);

    return res.status(500).json({
      error: "Erro ao deletar",
    });
  }
};
