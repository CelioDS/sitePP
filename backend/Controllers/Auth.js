import { dataBase } from "../DataBase/dataBase.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

export const LoginDB = async (req, res) => {
  try {
    const { login, senha } = req.body;

    if (!login || !senha) {
      return res
        .status(400)
        .json({ success: false, message: "Login e senha são obrigatórios." });
    }

    // 1) Busca só pelo login
    const [rows] = await dataBase.query(
      "SELECT id, login, senha AS senha_hash, admin, canal FROM usuariosAgen WHERE login = ? LIMIT 1",
      [login]
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Login ou senha inválidos" });
    }

    const user = rows[0];

    // 2) Compara a senha digitada com o hash do banco
    const ok = await bcrypt.compare(senha, user.senha_hash);
    if (!ok) {
      return res
        .status(401)
        .json({ success: false, message: "Login ou senha inválidos" });
    }

    // 3) Gera o token
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET ausente no .env");
      return res.status(500).json({ success: false, message: "Erro interno" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        login: user.login,
        admin: user.admin,
        canal: user.canal,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 4) Retorna usuário sem a senha
    return res.status(200).json({
      success: true,
      message: "Acesso concluído!",
      token,
      user: {
        id: user.id,
        login: user.login,
        admin: user.admin,
        canal: user.canal,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Erro no login" });
  }
};

export const validateToken = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.status(200).json(decoded);
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
};
