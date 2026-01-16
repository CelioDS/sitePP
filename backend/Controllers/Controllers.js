import { dataBase } from "../DataBase/dataBase.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

const ANOMES = format(
  fromZonedTime(new Date(), "America/Sao_Paulo"),
  "yyyy-MM"
).replace("-", "");

dotenv.config(); // <-- Carrega o arquivo .env

export const getLP = (req, res) => {
  const { anomes = ANOMES } = req.query;
  const query = "SELECT * FROM LP WHERE ANOMES = ?";

  dataBase.query(query, [anomes], (err, data) => {
    if (err) return res.json(err);

    return res.status(200).json(data);
  });
};

// ------------------LOGIN-------------------

// API de login
export const getDBLogin = async (_, res) => {
  try {
    const query = "SELECT * FROM usuariosAgen";
    const [rows] = await dataBase.query(query);

    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
};

export const setDBLogin = async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.senha, 10);
  const query = "INSERT INTO usuariosAgen (`login`,`senha`,`admin`) VALUES(?)";

  const values = [req.body.login, hashedPassword, req.body.admin];

  dataBase.query(query, [values], (err) => {
    if (err) return res.json(err);
    return res.status(200).json("Usuario criado");
  });
};

/**/
export const updateDBLogin = (req, res) => {
  const query =
    " UPDATE usuariosAgen SET `login` = ?, `senha` = ?, `admin` = ?  WHERE `id` = ?";

  const values = [req.body.login, req.body.senha, req.body.admin];

  dataBase.query(query, [...values, req.params.id], (err) => {
    if (err) return res.json(err);

    return res
      .status(200)
      .json({ message: "usuario atualizado", id: res.insertId });
  });
};

export const deleteDBLogin = (req, res) => {
  const query = "DELETE FROM usuariosAgen WHERE `id` = ?";

  dataBase.query(query, [req.params.id], (err) => {
    if (err) return res.json(err);
    return res.status(200).json("deletado");
  });
};

// ---------------VALIDAR LOGIN---------------------------------
export const LoginDB = async (req, res) => {
  try {
    const query = "SELECT * FROM usuariosAgen WHERE login = ?";
    const [rows] = await dataBase.promise().query(query, [req.body.login]);

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Login ou senha inválidos" });
    }

    const user = rows[0];

    const senhaValida = await bcrypt.compare(req.body.senha, user.senha);

    if (!senhaValida) {
      return res
        .status(401)
        .json({ success: false, message: "Login ou senha inválidos" });
    }

    const token = jwt.sign(
      { userId: user.id, login: user.login, admin: user.admin },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        login: user.login,
        admin: user.admin,
      },
      message: "Acesso concluído!",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro no login" });
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
