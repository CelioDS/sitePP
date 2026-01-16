import { dataBase } from "../DataBase/dataBase.js";
import dotenv from "dotenv";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import multer from "multer";
import XLSX from "xlsx";

const ANOMES = format(
  fromZonedTime(new Date(), "America/Sao_Paulo"),
  "yyyy-MM"
).replace("-", "");

dotenv.config(); // <-- Carrega o arquivo .env

export const upload = multer({
  dest: "uploads/",
});

/**___________________________LojaPropria___________________________**/
export const getLP = async (req, res) => {
  const { anomes = ANOMES } = req.query;
  const query = "SELECT * FROM LP WHERE ANOMES = ?";

  const [rows] = await dataBase.query(query, [anomes], (err, data) => {
    if (err) return res.json(err);

    return res.status(200).json(rows);
  });
};
export const setExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado" });
    }

    const workbook = XLSX.readFile(req.file.path);
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
    ]);

    const sql = `
      INSERT INTO LP
      (ANOMES, CANAL, COLABORADOR, LOGIN_CLARO, COMTA, CABEAMENTO, LOGIN_NET, LOJA, CIDADE, COORDENADOR, STATUS)
      VALUES ?
    `;

    await dataBase.query(sql, [values]);

    fs.unlinkSync(req.file.path);

    return res.json({
      message: "Arquivo importado com sucesso",
      inserted: values.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao importar Excel" });
  }
};
