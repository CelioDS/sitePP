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
      row.ANOMES,
      row.CANAL,
      row.COLABORADOR,
      row.LOGIN_CLARO,
      row.COMTA,
      row.CABEAMENTO,
      row.LOGIN_NET,
      row.LOJA,
      row.CIDADE,
      row.COORDENADOR,
      row.STATUS,
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
      row.ANOMES,
      row.CANAL,
      row.COMTA,
      row.GRUPO,
      row.PARCEIRO_LOJA,
      row.CNPJ,
      row.NOME,
      row.LOGIN_NET,
      row.TERRITORIO,
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
      (ANOMES, CANAL, COMTA, GRUPO, PARCEIRO_LOJA, CNPJ, NOME, LOGIN_NET, TERRITORIO, DATA_ATUALIZACAO, LOGIN_ATUALIZACAO)
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
      row.ANOMES,
      row.CANAL,
      row.IBGE,
      row.CIDADE,
      row.RAZAO_SOCIAL,
      row.PARCEIRO_LOJA,
      row.CNPJ,
      row.NOME,
      row.CLASSIFICACAO,
      row.SEGMENTO,
      row.PRODUTO_ATUACAO,
      row.DATA_CADASTRO,
      row.SITUACAO,
      row.LOGIN_NET,
      row.TIPO,
      row.LOGIN_CLARO,
      row.EXECUTIVO,
      row.GRUPO,
      row.COMTA,
      row.CABEAMENTO,
      row.FILIAL_COORDENADOR,
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
      (ANOMES,	CANAL,	IBGE,	CIDADE,	RAZAO_SOCIAL,	PARCEIRO_LOJA,	CNPJ,	NOME,	CLASSIFICACAO,	SEGMENTO,	PRODUTO_ATUACAO,	DATA_CADASTRO,	SITUACAO,	LOGIN_NET,	TIPO,	LOGIN_CLARO,	EXECUTIVO,	GRUPO,	COMTA,	CABEAMENTO,	FILIAL_COORDENADOR,
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
      row.ANOMES,
      row.CANAL,
      row.IBGE,
      row.CIDADE,
      row.RAZAO_SOCIAL,
      row.PARCEIRO_LOJA,
      row.CNPJ,
      row.NOME,
      row.CLASSIFICACAO,
      row.SEGMENTO,
      row.PRODUTO_ATUACAO,
      row.DATA_CADASTRO,
      row.SITUACAO,
      row.LOGIN_NET,
      row.TIPO,
      row.LOGIN_CLARO,
      row.EXECUTIVO,
      row.COMTA,
      row.CABEAMENTO,
      row.FILIAL_COORDENADOR,
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
      (ANOMES,	CANAL,	IBGE,	CIDADE,	RAZAO_SOCIAL,	PARCEIRO_LOJA,	CNPJ,	NOME,	CLASSIFICACAO,	SEGMENTO,	PRODUTO_ATUACAO,	DATA_CADASTRO,	SITUACAO,	LOGIN_NET,	TIPO,	LOGIN_CLARO,	EXECUTIVO,	COMTA,	CABEAMENTO,	FILIAL_COORDENADOR,
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
      row.ANOMES,
      row.CANAL,
      row.IBGE,
      row.CIDADE,
      row.RAZAO_SOCIAL,
      row.PARCEIRO_LOJA,
      row.CNPJ,
      row.NOME,
      row.CLASSIFICACAO,
      row.SEGMENTO,
      row.PRODUTO_ATUACAO,
      row.DATA_CADASTRO,
      row.SITUACAO,
      row.LOGIN_NET,
      row.TIPO,
      row.LOGIN_CLARO,
      row.EXECUTIVO,
      row.COMTA,
      row.CABEAMENTO,
      row.FILIAL_COORDENADOR,
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
      (ANOMES,	CANAL,	IBGE,	CIDADE,	RAZAO_SOCIAL,	PARCEIRO_LOJA,	CNPJ,	NOME,	CLASSIFICACAO,	SEGMENTO,	PRODUTO_ATUACAO,	DATA_CADASTRO,	SITUACAO,	LOGIN_NET,	TIPO,	LOGIN_CLARO,	EXECUTIVO,	COMTA,	CABEAMENTO,	FILIAL_COORDENADOR,
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
