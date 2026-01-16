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

export const getDB = (_, res) => {
  const query = "SELECT * FROM agendamento";

  dataBase.query(query, (err, data) => {
    if (err) return res.json(err);

    return res.status(200).json(data);
  });
};

export const getLP = (req, res) => {
  const { anomes = ANOMES } = req.query;
  const query = "SELECT * FROM LP WHERE ANOMES = ?";

  dataBase.query(query, [anomes], (err, data) => {
    if (err) return res.json(err);

    return res.status(200).json(data);
  });
};

export const setDB = (req, res) => {
  const query =
    "INSERT INTO agendamento (`curtidas`,`nome`,`descricao`,`tecnologias`,`imagem`,`site`,`repositorio`) VALUES(?)";

  const values = [
    req.body.curtidas,
    req.body.nome,
    req.body.descricao,
    req.body.tecnologias,
    req.body.imagem,
    req.body.site,
    req.body.repositorio,
  ];
  dataBase.query(query, [values], (err) => {
    if (err) return res.json(err);
    return res.status(200).json("Dados inseridos");
  });
};

export const updateDB = (req, res) => {
  const query =
    " UPDATE agendamento SET `sk_data` = ?, `nm_canal_venda_subgrupo` = ?, `nm_parceiro` = ?, `nm_periodo_agendamento` = ?, `desc_mun` = ?, `ddd_mun` = ?, `segmento_porte` = ?, `territorio` = ?, `flag_rota` = ?, `flag_agenda_futura` = ?, `data_futura` = ?, `motivo_quebra_d1` = ?, `motivo_quebra_ult` = ?, `dt_quebra_ult` = ?, `cd_operadora` = ?, `nr_contrato` = ?, `dt_abertura_os` = ?, `movimento` = ?, `contato_com_sucesso` = ?, `nova_data` = ?, `responsavel` = ?, `forma_contato` = ?, `tel_contato` = ?, `obs` = ?, `finalizado` = ? , `data_assumir` = ?  WHERE `id` = ?";

  const values = [
    req.body.sk_data,
    req.body.nm_canal_venda_subgrupo,
    req.body.nm_parceiro,
    req.body.nm_periodo_agendamento,
    req.body.desc_mun,
    req.body.ddd_mun,
    req.body.segmento_porte,
    req.body.territorio,
    req.body.flag_rota,
    req.body.flag_agenda_futura,
    req.body.data_futura,
    req.body.motivo_quebra_d1,
    req.body.motivo_quebra_ult,
    req.body.dt_quebra_ult,
    req.body.cd_operadora,
    req.body.nr_contrato,
    req.body.dt_abertura_os,
    req.body.movimento,
    req.body.contato_com_sucesso,
    req.body.nova_data,
    req.body.responsavel,
    req.body.forma_contato,
    req.body.tel_contato,
    req.body.obs,
    req.body.finalizado,
    req.body.data_assumir,
  ];

  dataBase.query(query, [...values, req.params.id], (err) => {
    if (err) return res.json(err);

    return res.status(200).json("agendamento atualizado");
  });
};

export const patchDB = (req, res) => {
  const { id } = req.params;
  const dados = req.body;

  if (!dados || Object.keys(dados).length === 0)
    return res
      .status(400)
      .json({ error: "Nenhum campo enviado para atualizar..." });

  const colunas = Object.keys(dados)
    .map((campo) => `${campo} = ?`)
    .join(", ");

  const valores = Object.values(dados);

  const query = `UPDATE agendamento set ${colunas} WHERE id = ?`;

  dataBase.query(query, [...valores, id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao atualizar agendamento" });
    }
  });
  return res.status(200).json("agendamento atualizado");
};

/******************UPDATE*** */

export const deleteDB = (req, res) => {
  const query = "DELETE FROM agendamento WHERE `id` = ?";

  dataBase.query(query, [req.params.id], (err) => {
    if (err) return res.json(err);
    return res.status(200).json("deletado");
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
