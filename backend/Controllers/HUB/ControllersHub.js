import { dataBase } from "../../DataBase/dataBase.js";
import dotenv from "dotenv";
import cloudinary from "../../cloundinary.js";
import { uploadBufferToCloudinary } from "./Cloundinary/uploadBufferToCloudinary.js";

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
      cnpj,
      razaoSocial,
      nome,
      email,
      loginUsuario,
      status_solicitacao,
      observacao,
      descricaoSolicitacao,
      HPCliente,
      enderecoCliente,
      cpfCliente,
      nomeCliente,
      criado_por,
    } = req.body;

    let anexosUrls = [];
    let anexosPublicIds = [];

    if (req.files && req.files.length > 0) {
      const uploads = await Promise.all(
        req.files.map((file) =>
          uploadBufferToCloudinary(file.buffer, "suporte_comercial"),
        ),
      );

      anexosUrls = uploads.map((item) => item.secure_url);
      anexosPublicIds = uploads.map((item) => item.public_id);
    }

    const sql = `
      INSERT INTO suporte_comercial (
        tipo_solicitacao,
        canal,
        sistema,
        numero_proposta,
        numero_contrato,
        numero_pedido,
        cnpj,
        razao_social,
        nome,
        email,
        login_usuario,
        status_solicitacao,
        observacao,
        descricao_solicitacao,
        hp_cliente,
        endereco_cliente,
        cpf_cliente,
        nome_cliente,
        anexo,
        anexo_public_id,
        criado_por
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      tipoSolicitacao || null,
      canal || null,
      sistema || null,
      numeroProposta || null,
      numeroContrato || null,
      numeroPedido || null,
      cnpj || null,
      razaoSocial || null,
      nome || null,
      email || null,
      loginUsuario || null,
      status_solicitacao || "PENDENTE",
      observacao || null,
      descricaoSolicitacao || null,
      HPCliente || null,
      enderecoCliente || null,
      cpfCliente || null,
      nomeCliente || null,

      anexosUrls.length ? JSON.stringify(anexosUrls) : null,
      anexosPublicIds.length ? JSON.stringify(anexosPublicIds) : null,

      criado_por || null,
    ];

    const [result] = await dataBase.query(sql, values);

    console.log("5️⃣ Depois do INSERT MySQL");

    return res.status(201).json({
      success: true,
      message: "Solicitação salva com sucesso",
      id: result.insertId,
      anexo: anexosUrls,
    });
  } catch (error) {
    console.error("Erro ao salvar suporte comercial:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Erro ao salvar solicitação",
    });
  }
};

/*------------------ CONFIG UPLOAD SUPORTE COMERCIAL imagens ------------------*/

const storage = multer.memoryStorage();

const tiposPermitidos = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

const fileFilter = (req, file, cb) => {
  if (!tiposPermitidos.includes(file.mimetype)) {
    return cb(
      new Error("Somente fotos são permitidas: JPG, PNG, WEBP ou HEIC"),
      false,
    );
  }

  cb(null, true);
};

export const uploadSuporte = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// ✅ UPDATE
export const updateSuporteComercial = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      tipoSolicitacao,
      canal,
      sistema,
      descricaoSolicitacao,
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
      status_solicitacao,
      criado_por,
      responsavel_descricao,
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
        descricao_solicitacao = ?,
        numero_proposta = ?,
        numero_contrato = ?,
        numero_pedido = ?,
        cnpj = ?,
        razao_social = ?,
        nome = ?,
        email = ?,
        login_usuario = ?,
        status_solicitacao = ?,
        observacao = ?,
        criado_por = ?,
        responsavel = ?,
        responsavel_descricao = ?,
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
      descricaoSolicitacao,
      numeroProposta,
      numeroContrato,
      numeroPedido,
      cnpj,
      razaoSocial,
      nome,
      email,
      loginUsuario,
      observacao,
      criado_por,
      responsavel,
      responsavel_descricao,
      status_solicitacao,
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

    let anexoUrl = null;
    let anexoPublicId = null;

    if (req.file) {
      const uploadResult = await uploadBufferToCloudinary(
        req.file.buffer,
        "suporte_comercial",
      );
      ((anexoUrl = uploadResult.secure_url),
        (anexoPublicId = uploadResult.public_id));
    }

    // ✅ remove campos vazios
    const entries = Object.entries(data).filter(
      ([_, value]) => value !== undefined && value !== null,
    );

    //adicionar campons vazios
    if (anexoUrl) {
      entries.push(["responsavel_anexo", anexoUrl]);
      entries.push(["anexo_public_id", anexoPublicId]);
    }

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
