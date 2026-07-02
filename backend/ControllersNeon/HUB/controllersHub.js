import { neonDB } from "../../DataBase/neonDatabase.js"; // Importando sua conexão Neon
import dotenv from "dotenv";
import { uploadBufferToCloudinary } from "../../Controllers/HUB/Cloundinary/uploadBufferToCloudinary.js";
import multer from "multer";

dotenv.config();

// ✅ GET TODOS
export const getSuporteComercial = async (req, res) => {
  try {
    const result = await neonDB.query(
      `SELECT * FROM suporte_comercial ORDER BY id DESC`,
    );

    return res.status(200).json(result.rows);
  } catch (err) {
    console.error("Erro get:", err);
    return res.status(500).json({ error: "Erro ao buscar dados" });
  }
};

// ✅ GET POR ID
export const getSuporteComercialID = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await neonDB.query(
      `SELECT * FROM suporte_comercial WHERE id = $1`,
      [id],
    );

    return res.status(200).json(result.rows);
  } catch (err) {
    console.error("Erro getById:", err);
    return res.status(500).json({ error: "Erro ao buscar ID" });
  }
};

// ✅ INSERT
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

    let anexoUrl = null;
    let anexoPublicId = null;

    if (req.file) {
      const uploadResult = await uploadBufferToCloudinary(
        req.file.buffer,
        "suporte_comercial",
      );

      anexoUrl = uploadResult.secure_url;
      anexoPublicId = uploadResult.public_id;
    }

    const sql = `
      INSERT INTO suporte_comercial (
        tipo_solicitacao, canal, sistema, numero_proposta,
        numero_contrato, numero_pedido, cnpj, razao_social,
        nome, email, login_usuario, status_solicitacao,
        observacao, descricao_solicitacao, hp_cliente,
        endereco_cliente, cpf_cliente, nome_cliente,
        anexo, anexo_public_id, criado_por
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
      )
      RETURNING id
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
      anexoUrl,
      anexoPublicId,
      criado_por || null,
    ];

    const result = await neonDB.query(sql, values);

    return res.status(201).json({
      success: true,
      id: result.rows[0].id,
      anexo: anexoUrl,
    });
  } catch (error) {
    console.error("Erro ao salvar:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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
      loginUsuario,
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
        tipo_solicitacao = $1,
        canal = $2,
        sistema = $3,
        descricao_solicitacao = $4,
        numero_proposta = $5,
        numero_contrato = $6,
        numero_pedido = $7,
        cnpj = $8,
        razao_social = $9,
        nome = $10,
        email = $11,
        login_usuario = $12,
        status_solicitacao = $13,
        observacao = $14,
        criado_por = $15,
        responsavel = $16,
        responsavel_descricao = $17,
        nome_cliente = $18,
        hp_cliente = $19,
        endereco_cliente = $20,
        cpf_cliente = $21
      WHERE id = $22
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
      status_solicitacao,
      observacao,
      criado_por,
      responsavel,
      responsavel_descricao,
      nomeCliente,
      HPCliente,
      enderecoCliente,
      cpfCliente,
      id,
    ];

    await neonDB.query(query, values);

    return res.status(200).json({ msg: "Atualizado ✅" });
  } catch (err) {
    console.error("Erro update:", err);
    return res.status(500).json({ error: "Erro ao atualizar" });
  }
};

// ✅ PATCH (dinâmico)
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

      anexoUrl = uploadResult.secure_url;
      anexoPublicId = uploadResult.public_id;
    }

    const entries = Object.entries(data).filter(
      ([_, value]) => value !== undefined && value !== null,
    );

    if (anexoUrl) {
      entries.push(["responsavel_anexo", anexoUrl]);
      entries.push(["anexo_public_id", anexoPublicId]);
    }

    if (!entries.length) {
      return res.status(400).json({ error: "Nada para atualizar" });
    }

    const fields = entries
      .map(([key], index) => `${key} = $${index + 1}`)
      .join(", ");

    const values = entries.map(([_, value]) => value);

    const query = `
      UPDATE suporte_comercial
      SET ${fields}
      WHERE id = $${values.length + 1}
    `;

    await neonDB.query(query, [...values, id]);

    

    return res.status(200).json({ msg: "Atualizado parcialmente ✅" });
  } catch (err) {
    console.error("Erro PATCH:", err);
    return res.status(500).json({ error: "Erro ao atualizar" });
  }
};

// ✅ DELETE
export const deleteSuporteComercial = async (req, res) => {
  try {
    const { id } = req.params;

    await neonDB.query(`DELETE FROM suporte_comercial WHERE id = $1`, [id]);

    return res.status(200).json({ msg: "Deletado ✅" });
  } catch (err) {
    console.error("Erro delete:", err);
    return res.status(500).json({ error: "Erro ao deletar" });
  }
};

// ✅ UPLOAD
const storage = multer.memoryStorage();

const tiposPermitidos = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

const fileFilter = (req, file, cb) => {
  if (!tiposPermitidos.includes(file.mimetype)) {
    return cb(new Error("Somente JPG, PNG, WEBP ou HEIC"), false);
  }

  cb(null, true);
};

export const uploadSuporte = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
