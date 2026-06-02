import { dataBase } from "../../DataBase/dataBase.js";
import dotenv from "dotenv";

import multer from "multer";
import path from "path";
import fs from "fs";

dotenv.config();

// ✅ GET TODOS
export const getSuporteComercial = async (req, res) => {
  try {
    const [rows] = await dataBase.query(
      `SELECT * FROM suporte_comercial ORDER BY id DESC`,
    );
    return res.status(200).json(rows);
  } catch (err) {
    console.error("Erro get:", err);
    return res.status(500).json({ error: "Erro ao buscar dados" });
  }
};

// ✅ GET POR ID
export const getSuporteComercialID = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await dataBase.query(
      `SELECT * FROM suporte_comercial WHERE id = ?`,
      [id],
    );

    return res.status(200).json(rows);
  } catch (err) {
    console.error("Erro getById:", err);
    return res.status(500).json({ error: "Erro ao buscar ID" });
  }
};

// ✅ INSERT COM ANEXO
/*------------------ INSERT COM ANEXO ------------------*/
export const setSuporteComercial = async (req, res) => {
  try {
    const {
      tipoSolicitacao,
      canal,
      sistema,
      numeroProposta,
      numeroContrato,
      numeroPedido,
      descricao,
      cnpj,
      razaoSocial,
      nome,
      email,
      loginUsuario,
      login_usuario,
      observacao,
      responsavel,
      HPCliente,
      enderecoCliente,
      cpfCliente,
      nomeCliente,
    } = req.body;

    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const anexo = req.file
      ? `/uploads/suporte-comercial/${req.file.filename}`
      : null;

    const query = `
      INSERT INTO suporte_comercial (
        tipo_solicitacao,
        canal,
        sistema,
        descricao,
        numero_proposta,
        numero_contrato,
        numero_pedido,
        cnpj,
        razao_social,
        nome,
        email,
        login_usuario,
        observacao,
        responsavel,
        nome_cliente,
        hp_cliente,
        endereco_cliente,
        cpf_cliente,
        anexo
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      tipoSolicitacao || null,
      canal || null,
      sistema || null,
      descricao || null,
      numeroProposta || null,
      numeroContrato || null,
      numeroPedido || null,
      cnpj || null,
      razaoSocial || null,
      nome || null,
      email || null,
      loginUsuario || login_usuario || null,
      observacao || null,
      responsavel || null,
      nomeCliente || null,
      HPCliente || null,
      enderecoCliente || null,
      cpfCliente || null,
      anexo,
    ];
    (console.log("HEADERS:", req.headers["content-type"]),
      console.log("BODY:", req.body),
      console.log("FILE:", req.file));

    const [result] = await dataBase.query(query, values);

    return res.status(201).json({
      id: result.insertId,
      msg: "Criado com sucesso ✅",
      anexo,
    });
  } catch (err) {
    console.error("Erro insert:", err);
    return res.status(500).json({
      error: "Erro ao inserir dados",
      detalhe: err.message,
    });
  }
};

/*------------------ CONFIG UPLOAD SUPORTE COMERCIAL ------------------*/
/*

const uploadDirSuporte = "uploads/suporte-comercial";

if (!fs.existsSync(uploadDirSuporte)) {
  fs.mkdirSync(uploadDirSuporte, { recursive: true });
}

const storageSuporte = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirSuporte);
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);

    const nomeOriginal = path
      .basename(file.originalname, ext)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^\w.-]/g, "");

    const nomeArquivo = `${Date.now()}_${nomeOriginal}${ext}`;

    cb(null, nomeArquivo);
  },
});

const fileFilterSuporte = function (req, file, cb) {
  const tiposPermitidos = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ];

  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de arquivo não permitido"), false);
  }
};

export const uploadSuporte = multer({
  storage: storageSuporte,
  fileFilter: fileFilterSuporte,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});
*/
// ✅ UPDATE
export const updateSuporteComercial = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      tipoSolicitacao,
      canal,
      sistema,
      descricao,
      numeroProposta,
      numeroContrato,
      numeroPedido,
      cnpj,
      razaoSocial,
      nome,
      email,
      login_usuario,
      observacao,
      responsavel,
      HPCliente,
      enderecoCliente,
      cpfCliente,
      nomeCliente,
    } = req.body;

    const query = `
      UPDATE suporte_comercial SET
        tipo_solicitacao = ?,
        canal = ?,
        sistema = ?,
        descricao = ?,
        numero_proposta = ?,
        numero_contrato = ?,
        numero_pedido = ?,
        cnpj = ?,
        razao_social = ?,
        nome = ?,
        email = ?,
        login_usuario = ?,
        observacao = ?,
        responsavel = ?,
        nome_cliente = ?,
        hp_cliente = ?,
        endereco_cliente = ?,
        cpf_cliente = ?
      WHERE id = ?
    `;

    const values = [
      tipoSolicitacao,
      canal,
      sistema,
      descricao,
      numeroProposta,
      numeroContrato,
      numeroPedido,
      cnpj,
      razaoSocial,
      nome,
      email,
      loginUsuario,
      observacao,
      responsavel,
      HPCliente,
      enderecoCliente,
      cpfCliente,
      nomeCliente,
      id,
    ];

    await dataBase.query(query, values);

    return res.status(200).json({
      msg: "Atualizado com sucesso ✅",
    });
  } catch (err) {
    console.error("Erro update:", err);
    return res.status(500).json({ error: "Erro ao atualizar" });
  }
};

//PATCH

export const patchSuporteComercial = async (req, res) => {
  try {
    const { id } = req.params;

    const data = req.body;

    // ✅ remove campos vazios
    const entries = Object.entries(data).filter(
      ([_, value]) => value !== undefined && value !== null,
    );

    if (!entries.length) {
      return res.status(400).json({ error: "Nada para atualizar" });
    }

    // ✅ monta query dinâmica
    const fields = entries.map(([key]) => `${key} = ?`).join(", ");
    const values = entries.map(([_, value]) => value);

    const query = `
      UPDATE suporte_comercial
      SET ${fields}
      WHERE id = ?
    `;

    await dataBase.query(query, [...values, id]);

    return res.status(200).json({
      msg: "Atualizado parcialmente ✅",
    });
  } catch (err) {
    console.error("Erro PATCH:", err);
    return res.status(500).json({ error: "Erro ao atualizar" });
  }
};

// ✅ DELETE
export const deleteSuporteComercial = async (req, res) => {
  try {
    const { id } = req.params;

    await dataBase.query(`DELETE FROM suporte_comercial WHERE id = ?`, [id]);

    return res.status(200).json({
      msg: "Deletado com sucesso ✅",
    });
  } catch (err) {
    console.error("Erro delete:", err);
    return res.status(500).json({ error: "Erro ao deletar" });
  }
};
