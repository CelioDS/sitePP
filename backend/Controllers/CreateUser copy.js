import { dataBase } from "../DataBase/dataBase.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

// ------------------LOGIN-------------------

export const getDBLogin = async (_, res) => {
  try {
    const query = "SELECT * FROM usuariosAgen";
    const [rows] = await dataBase.query(query);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar usuários" });
  }
};

export const setDBLogin = async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.senha, 10);
    const query =
      "INSERT INTO usuariosAgen (`login`, `senha`, `canal`, `admin`) VALUES (?)";

    // Corrigida a ordem para bater com a Query (canal e admin)
    const values = [
      req.body.login,
      hashedPassword,
      req.body.canal,
      req.body.admin,
    ];

    dataBase.query(query, [values], (err) => {
      if (err) return res.status(500).json(err);
      return res.status(201).json("Usuário criado com sucesso");
    });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao processar senha" });
  }
};

export const updateDBLogin = async (req, res) => {
  try {
    const { login, senha, canal, admin } = req.body;
    const { id } = req.params;

    // Idealmente, você deve hashear a senha aqui também se ela foi alterada
    const hashedPassword = await bcrypt.hash(senha, 10);

    const query =
      "UPDATE usuariosAgen SET `login` = ?, `senha` = ?, `canal` = ?, `admin` = ? WHERE `id` = ?";
    const values = [login, hashedPassword, canal, admin, id];

    dataBase.query(query, values, (err) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json({ message: "Usuário atualizado" });
    });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao atualizar" });
  }
};

export const deleteDBLogin = (req, res) => {
  const query = "DELETE FROM usuariosAgen WHERE `id` = ?";

  dataBase.query(query, [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json("Usuário deletado");
  });
};
