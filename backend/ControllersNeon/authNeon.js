import { neonDB } from "../DataBase/neonDatabase.js"; // Importando sua conexão Neon
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

export const LoginDBNeon = async (req, res) => {
  try {
    const { login, senha } = req.body;

    if (!login || !senha) {
      return res
        .status(400)
        .json({ success: false, message: "Login e senha são obrigatórios." });
    }

    // 1) Busca pelo login (Postgres usa $1 e os dados vêm em result.rows)
    const query = `
      SELECT id, login, nome, senha AS senha_hash, admin, canal, mis, mis_admin 
      FROM usuariosAgen 
      WHERE login = $1 
      LIMIT 1
    `;
    
    const result = await neonDB.query(query, [login]);

    // No Postgres, verificamos se o array rows está vazio
    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Login ou senha inválidos" });
    }

    const user = result.rows[0];

    // 2) Compara a senha digitada com o hash do banco
    const ok = await bcrypt.compare(senha, user.senha_hash);
    if (!ok) {
      return res
        .status(401)
        .json({ success: false, message: "Login ou senha inválidos" });
    }

    // 3) Gera o token
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET ausente no .env");
      return res.status(500).json({ success: false, message: "Erro interno" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        mis: user.mis,
        nome: user.nome,
        login: user.login,
        admin: user.admin,
        canal: user.canal,
        mis_admin: user.mis_admin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 4) Retorna usuário sem a senha
    return res.status(200).json({
      success: true,
      message: "Acesso concluído via Neon!",
      token,
      user: {
        id: user.id,
        login: user.login,
        nome: user.nome,
        admin: user.admin,
        mis: user.mis,
        canal: user.canal,
        mis_admin: user.mis_admin,
      },
    });
  } catch (err) {
    console.error("❌ Erro no login Neon:", err);
    return res.status(500).json({ success: false, message: "Erro no login" });
  }
};

export const validateTokenNeon = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.status(200).json(decoded);
  } catch (err) {
    return res.status(401).json({ message: "Token inválido ou expirado" });
  }
};