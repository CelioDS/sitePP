import { neonDB } from "../DataBase/neonDatabase.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

// ------------------ LOGIN NEON (POSTGRES) -------------------

// GET: lista todos
export const getDBLoginNeon = async (_, res) => {
  try {
    const query = "SELECT * FROM usuariosAgen";
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
    const query = "SELECT * FROM usuariosAgen WHERE id = $1"; // $1 em vez de ?
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
      INSERT INTO usuariosAgen (login, nome, senha, canal, mis, admin, mis_admin, ultimo_acesso, ocultar)
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
        UPDATE usuariosAgen
           SET login = $1, nome = $2, senha = $3, canal = $4, mis = $5, admin = $6, ultimo_acesso = $7
         WHERE id = $8
      `;
      params = [login, nome, hashed, canal, mis, admin, ultimo_acesso, id];
    } else {
      sql = `
        UPDATE usuariosAgen
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
    const query = "DELETE FROM usuariosAgen WHERE id = $1";
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