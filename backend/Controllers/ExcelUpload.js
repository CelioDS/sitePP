import { dataBase } from "../DataBase/dataBase.js";
import dotenv from "dotenv";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import multer from "multer";
import XLSX from "xlsx";
import fs from "fs";

dotenv.config(); // <-- Carrega o arquivo .env

export const upload = multer({
  storage: multer.memoryStorage(),
});

const normalize = (valor) =>
  typeof valor === "string" ? valor.trim().toUpperCase() : valor;
/**___________________________LojaPropria___________________________**/

export const setExcelLP = async (req, res) => {
  try {
    const login = req.headers.login;
    const TODAY = format(
      fromZonedTime(new Date(), "America/Sao_Paulo"),
      "yyyy-MM-dd-HH-mm",
    );
    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return res.status(400).json({ error: "Planilha vazia" });
    }

    const values = rows.map((row) => [
      normalize(row.ANOMES),
      normalize(row.CANAL),
      normalize(row.COLABORADOR),
      normalize(row.LOGIN_CLARO),
      normalize(row.COMTA),
      normalize(row.CABEAMENTO),
      normalize(row.LOGIN_NET),
      normalize(row.LOJA),
      normalize(row.CIDADE),
      normalize(row.COORDENADOR),
      normalize(row.STATUS),
      TODAY,
      login,
    ]);

    if (rows.length < values.length) {
      return res.status(400).json({ error: "Planilha com colunas faltando" });
    }
    if (rows.length > values.length) {
      return res.status(400).json({ error: "Planilha com colunas a mais" });
    }

    const sql = `
      INSERT INTO LP
      (ANOMES, CANAL, COLABORADOR, LOGIN_CLARO, COMTA, CABEAMENTO, LOGIN_NET, LOJA, CIDADE, COORDENADOR, STATUS, DATA_ATUALIZACAO, LOGIN_ATUALIZACAO)
      VALUES ?
    `;

    await dataBase.query(sql, [values]);

    return res.json({
      message: "Arquivo importado com sucesso",
      inserted: values.length,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro ao importar Excel",
      sql: error.sqlMessage || error.message || "Erro desconhecido",
    });
  }
};

export const setExcelPME = async (req, res) => {
  try {
    const login = req.headers.login;
    const TODAY = format(
      fromZonedTime(new Date(), "America/Sao_Paulo"),
      "yyyy-MM-dd-HH-mm",
    );
    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return res.status(400).json({ error: "Planilha vazia" });
    }

    const values = rows.map((row) => [
      normalize(row.ANOMES),
      normalize(row.CPF),
      normalize(row.NOME),
      normalize(row.INPUT),
      normalize(row.LOGIN_NET),
      normalize(row.CNPJ_CPF),
      normalize(row.RAZAO_SOCIAL),
      normalize(row.SITUACAO),
      normalize(row.CELULAR),
      normalize(row.EMAIL),
      normalize(row.EMAIL_GESTOR),
      normalize(row.COD),
      normalize(row.COMTA),
      normalize(row.COORDENADOR),
      normalize(row.GERENTE),
      normalize(row.TERRITORIO),
      normalize(row.CANAL),
      normalize(row.REGIONAL),
      normalize(row.TIME),
      TODAY,
      login,
    ]);

    if (rows.length < values.length) {
      return res.status(400).json({ error: "Planilha com colunas faltando" });
    }
    if (rows.length > values.length) {
      return res.status(400).json({ error: "Planilha com colunas a mais" });
    }

    const sql = `
      INSERT INTO PME
      (ANOMES, CPF,	NOME,	INPUT,	LOGIN_NET,	CNPJ_CPF,	RAZAO_SOCIAL,	SITUACAO,	CELULAR,	EMAIL,	EMAIL_GESTOR,	COD,	COMTA,	COORDENADOR,	GERENTE,	TERRITORIO, CANAL,	REGIONAL, 	TIME, DATA_ATUALIZACAO, LOGIN_ATUALIZACAO)
      VALUES ?
    `;

    await dataBase.query(sql, [values]);

    return res.json({
      message: "Arquivo importado com sucesso",
      inserted: values.length,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro ao importar Excel",
      sql: error.sqlMessage || error.message || "Erro desconhecido",
    });
  }
};

export const setExcelPAP = async (req, res) => {
  try {
    const REQUIRED_COLUMNS = [
      "ANOMES",
      "CANAL",
      "ESTRUTURA",
      "IBGE",
      "CNPJ",
      "PARCEIRO_LOJA",
      "CLASSIFICACAO",
      "SEGMENTO",
      "LOGIN_NET",
      "LOGIN_CLARO",
      "NOME",
      "DATA_CADASTRO_VENDEDOR",
      "SITUACAO",
      "EXECUTIVO",
      "FILIAL_COORDENADOR",
    ];

    const login = req.headers.login;
    const TODAY = format(
      fromZonedTime(new Date(), "America/Sao_Paulo"),
      "yyyy-MM-dd-HH-mm",
    );
    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return res.status(400).json({ error: "Planilha vazia" });
    }

    const excelColumns = Object.keys(rows[0]);

    const missingColumns = REQUIRED_COLUMNS.filter(
      (col) => !excelColumns.includes(col),
    );

    const extraColumns = excelColumns.filter(
      (col) => !REQUIRED_COLUMNS.includes(col),
    );

    if (missingColumns.length > 0) {
      return res
        .status(400)
        .json({ error: "colunas obrigatorios faltando", missingColumns });
    }

    if (extraColumns.length > 0) {
      return res
        .status(400)
        .json({ error: "colunas extras encontradas", extraColumns });
    }

    const values = rows.map((row) => [
      normalize(row.ANOMES),
      normalize(row.CANAL),
      normalize(row.ESTRUTURA),
      normalize(row.IBGE),
      normalize(row.CNPJ),
      normalize(row.PARCEIRO_LOJA),
      normalize(row.CLASSIFICACAO),
      normalize(row.SEGMENTO),
      normalize(row.LOGIN_NET),
      normalize(row.LOGIN_CLARO),
      normalize(row.NOME),
      normalize(row.DATA_CADASTRO_VENDEDOR),
      normalize(row.SITUACAO),
      normalize(row.EXECUTIVO),
      normalize(row.FILIAL_COORDENADOR),
      TODAY,
      login,
    ]);

    if (rows.length < values.length) {
      return res.status(400).json({ error: "Planilha com colunas faltando" });
    }
    if (rows.length > values.length) {
      return res.status(400).json({ error: "Planilha com colunas a mais" });
    }

    const sql = `
      INSERT INTO PAP
      (ANOMES,
      CANAL,
      ESTRUTURA,
      IBGE,
      CNPJ,
      PARCEIRO_LOJA,
      CLASSIFICACAO,
      SEGMENTO,
      LOGIN_NET,
      LOGIN_CLARO,
      NOME,
      DATA_CADASTRO_VENDEDOR,
      SITUACAO,
      EXECUTIVO,
      FILIAL_COORDENADOR,
 DATA_ATUALIZACAO, LOGIN_ATUALIZACAO)
      VALUES ?
    `;

    await dataBase.query(sql, [values]);

    return res.json({
      message: "Arquivo importado com sucesso",
      inserted: values.length,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro ao importar Excel",
      sql: error.sqlMessage || error.message || "Erro desconhecido",
    });
  }
};

export const setExcelExclusivos = async (req, res) => {
  try {
    const REQUIRED_COLUMNS = [
      "ANOMES",
      "REGIONAL",
      "MAT_BCC",
      "MAT_REVOLUTION",
      "FUNCIONARIO",
      "CARGO",
      "GESTOR_1",
      "GESTOR_2",
      "GESTOR_3",
      "CIDADE",
      "STATUS",
      "ADMISSAO",
      "LOGIN_NET",
      "CANAL",
      "CHAVE",
      "MATRICULA_EXECUTIVO",
      "EXECUTIVO",
      "FILIAL_COORDENADOR",
    ];

    const login = req.headers.login;
    const TODAY = format(
      fromZonedTime(new Date(), "America/Sao_Paulo"),
      "yyyy-MM-dd-HH-mm",
    );
    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return res.status(400).json({ error: "Planilha vazia" });
    }

    const excelColumns = Object.keys(rows[0]);

    const missingColumns = REQUIRED_COLUMNS.filter(
      (col) => !excelColumns.includes(col),
    );

    const extraColumns = excelColumns.filter(
      (col) => !REQUIRED_COLUMNS.includes(col),
    );

    if (missingColumns.length > 0) {
      return res
        .status(400)
        .json({ error: "Planilha com colunas faltando", missingColumns });
    }

    if (extraColumns.length > 0) {
      return res
        .status(400)
        .json({ error: "Planilha com colunas a mais", extraColumns });
    }

    const values = rows.map((row) => [
      normalize(row.ANOMES),
      normalize(row.REGIONAL),
      normalize(row.MAT_BCC),
      normalize(row.MAT_REVOLUTION),
      normalize(row.FUNCIONARIO),
      normalize(row.CARGO),
      normalize(row.GESTOR_1),
      normalize(row.GESTOR_2),
      normalize(row.GESTOR_3),
      normalize(row.CIDADE),
      normalize(row.STATUS),
      normalize(row.ADMISSAO),
      normalize(row.LOGIN_NET),
      normalize(row.CANAL),
      normalize(row.CHAVE),
      normalize(row.MATRICULA_EXECUTIVO),
      normalize(row.EXECUTIVO),
      normalize(row.FILIAL_COORDENADOR),
      TODAY,
      login,
    ]);

    if (rows.length < values.length) {
      return res.status(400).json({ error: "Planilha com colunas faltando" });
    }
    if (rows.length > values.length) {
      return res.status(400).json({ error: "Planilha com colunas a mais" });
    }

    const sql = `
      INSERT INTO EXCLUSIVOS
      (
      ANOMES,
      REGIONAL,
      MAT_BCC,
      MAT_REVOLUTION,
      FUNCIONARIO,
      CARGO,
      GESTOR_1,
      GESTOR_2,
      GESTOR_3,
      CIDADE,
      STATUS,
      ADMISSAO,
      LOGIN_NET,
      CANAL,
      CHAVE,
      MATRICULA_EXECUTIVO,
      EXECUTIVO,
      FILIAL_COORDENADOR,
      DATA_ATUALIZACAO,
      LOGIN_ATUALIZACAO
      )
      VALUES ?
    `;

    await dataBase.query(sql, [values]);

    return res.json({
      message: "Arquivo importado com sucesso",
      inserted: values.length,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro ao importar Excel",
      sql: error.sqlMessage || error.message || "Erro desconhecido",
    });
  }
};

export const setExcelAA = async (req, res) => {
  try {
    const login = req.headers.login;
    const TODAY = format(
      fromZonedTime(new Date(), "America/Sao_Paulo"),
      "yyyy-MM-dd-HH-mm",
    );
    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return res.status(400).json({ error: "Planilha vazia" });
    }

    const values = rows.map((row) => [
      normalize(row.ANOMES),
      normalize(row.CANAL),
      normalize(row.IBGE),
      normalize(row.CIDADE),
      normalize(row.RAZAO_SOCIAL),
      normalize(row.PARCEIRO_LOJA),
      normalize(row.CNPJ),
      normalize(row.NOME),
      normalize(row.CLASSIFICACAO),
      normalize(row.SEGMENTO),
      normalize(row.PRODUTO_ATUACAO),
      normalize(row.DATA_CADASTRO),
      normalize(row.SITUACAO),
      normalize(row.LOGIN_NET),
      normalize(row.TIPO),
      normalize(row.LOGIN_CLARO),
      normalize(row.EXECUTIVO),
      normalize(row.COMTA),
      normalize(row.CABEAMENTO),
      normalize(row.FILIAL_COORDENADOR),
      normalize(row.GN),
      normalize(row.NM_EQUIPE_VENDA),
      TODAY,
      login,
    ]);

    if (rows.length < values.length) {
      return res.status(400).json({ error: "Planilha com colunas faltando" });
    }
    if (rows.length > values.length) {
      return res.status(400).json({ error: "Planilha com colunas a mais" });
    }

    const sql = `
      INSERT INTO AA
      (ANOMES,	CANAL,	IBGE,	CIDADE,	RAZAO_SOCIAL,	PARCEIRO_LOJA,	CNPJ,	NOME,	CLASSIFICACAO,	SEGMENTO,	PRODUTO_ATUACAO,	DATA_CADASTRO,	SITUACAO,	LOGIN_NET,	TIPO,	LOGIN_CLARO,	EXECUTIVO,	COMTA,	CABEAMENTO,	FILIAL_COORDENADOR, GN, NM_EQUIPE_VENDA,
 DATA_ATUALIZACAO, LOGIN_ATUALIZACAO)
      VALUES ?
    `;

    await dataBase.query(sql, [values]);

    return res.json({
      message: "Arquivo importado com sucesso",
      inserted: values.length,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro ao importar Excel",
      sql: error.sqlMessage || error.message || "Erro desconhecido",
    });
  }
};

export const setExcelVarejo = async (req, res) => {
  try {
    const login = req.headers.login;
    const TODAY = format(
      fromZonedTime(new Date(), "America/Sao_Paulo"),
      "yyyy-MM-dd-HH-mm",
    );
    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return res.status(400).json({ error: "Planilha vazia" });
    }

    const values = rows.map((row) => [
      normalize(row.ANOMES),
      normalize(row.CANAL),
      normalize(row.IBGE),
      normalize(row.COD_PDV),
      normalize(row.PARCEIRO_LOJA),
      normalize(row.CNPJ),
      normalize(row.NOME_COLABORADOR),
      normalize(row.CARGO),
      normalize(row.CPF_COLABORADOR),
      normalize(row.PRODUTO_ATUACAO),
      normalize(row.DATA_CADASTRO),
      normalize(row.SITUACAO),
      normalize(row.LOGIN_NET),
      normalize(row.FILIAL_COORDENADOR),
      normalize(row.GN),
      TODAY,
      login,
    ]);

    if (rows.length < values.length) {
      return res.status(400).json({ error: "Planilha com colunas faltando" });
    }
    if (rows.length > values.length) {
      return res.status(400).json({ error: "Planilha com colunas a mais" });
    }

    const sql = `
      INSERT INTO VAREJO
      (ANOMES,CANAL,IBGE,COD_PDV,PARCEIRO_LOJA,CNPJ,NOME_COLABORADOR
,CARGO,CPF_COLABORADOR,PRODUTO_ATUACAO,DATA_CADASTRO,SITUACAO,LOGIN_NET,FILIAL_COORDENADOR,GN,
 DATA_ATUALIZACAO, LOGIN_ATUALIZACAO)
      VALUES ?
    `;

    await dataBase.query(sql, [values]);

    return res.json({
      message: "Arquivo importado com sucesso",
      inserted: values.length,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro ao importar Excel",
      sql: error.sqlMessage || error.message || "Erro desconhecido",
    });
  }
};
