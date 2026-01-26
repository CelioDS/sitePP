import { dataBase } from "../DataBase/dataBase.js";
import dotenv from "dotenv";
import { format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

const ANOMES = format(
  fromZonedTime(new Date(), "America/Sao_Paulo"),
  "yyyy-MM",
).replace("-", "");

dotenv.config();

export const getLP = async (req, res) => {
  try {
    const { anomes = ANOMES } = req.query;

    const query = 'WITH CTE_MAX_DATA AS (SELECT MAX(DATA_ATUALIZACAO) AS DATA_MAX FROM LP) SELECT * FROM LP JOIN CTE_MAX_DATA ON LP.DATA_ATUALIZACAO =  CTE_MAX_DATA.DATA_MAX; ';

    const [rows] = await dataBase.query(query, [anomes]);

    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar LP" });
  }
};


export const getPAP = async (req, res) => {
  try {
    const { anomes = ANOMES } = req.query;

    const query = 'WITH CTE_MAX_DATA AS (SELECT MAX(DATA_ATUALIZACAO) AS DATA_MAX FROM PAP) SELECT * FROM PAP JOIN CTE_MAX_DATA ON PAP.DATA_ATUALIZACAO =  CTE_MAX_DATA.DATA_MAX; ';

    const [rows] = await dataBase.query(query, [anomes]);

    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar PAP" });
  }
};


