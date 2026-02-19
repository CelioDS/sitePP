import express from "express";

import {
  getDBLogin,
  setDBLogin,
  getDBLoginID,
  deleteDBLogin,
  updateDBLogin,
} from "../Controllers/CreateUser.js";

import {
  getDBtarefas,
  setDBtarefas,
  getDBtarefasID,
  updateDBtarefas,
  deleteDBtarefas,
} from "../Controllers/Todo.js";

import {
  getAA,
  getLP,
  getPAP,
  getPDU,
  getPME,
  getVAREJO,
  getPduFull,
  getPDUMovel,
  getAPARELHO,
  getLP_grafico,
  getPAP_PREMIUM,
  getVAREJO_grafico,
  getPduFullGrafico,
  getLP_graficoHistorico,
  getVAREJO_graficoHistorico,
} from "../Controllers/Controllers.js";

import { LoginDB, validateToken } from "../Controllers/Auth.js";

import {
  upload,
  setExcelLP,
  setExcelAA,
  setExcelPME,
  setExcelPAP,
  setExcelVarejo,
} from "../Controllers/ExcelUpload.js";

const router = express.Router();

/*------------------ ROTAS RAIZ------------------*/

router.get("/", getLP);
router.get("/pdu", getPDU);
router.get("/pme", getPME);
router.get("/varejo", getVAREJO);
router.get("/lojapropria", getLP);
router.get("/portaaporta", getPAP);
router.get("/agenteautorizado", getAA);
router.get("/pap_premium", getPAP_PREMIUM);

/*------------------ ROTAS RAIZ ANALLITICAS ------------------*/

router.get("/PduFull", getPduFull);
router.get("/aparelho", getAPARELHO);
router.get("/PduMovel", getPDUMovel);
router.get("/PduFullGrafico", getPduFullGrafico);
router.get("/lojapropriaGrafico", getLP_grafico);
router.get("/VAREJOGrafico", getVAREJO_grafico);
router.get("/VAREJOGraficoHistorico", getVAREJO_graficoHistorico);
router.get("/lojapropriaGraficoHistorico", getLP_graficoHistorico);

/*------------------ ROTAS RAIZ To Do ------------------*/

router.get("/todo", getDBtarefas);
router.post("/todo/add", setDBtarefas);
router.get("/todo/:id", getDBtarefasID);
router.put("/todo/:id", updateDBtarefas);
router.delete("/todo/:id", deleteDBtarefas);

/*------------------ EXCEL UPLOAD ------------------*/

router.post("/upload-excel-lp", upload.single("file"), setExcelLP);
router.post("/upload-excel-AA", upload.single("file"), setExcelAA);
router.post("/upload-excel-pme", upload.single("file"), setExcelPME);
router.post("/upload-excel-PAP", upload.single("file"), setExcelPAP);
router.post("/upload-excel-Varejo", upload.single("file"), setExcelVarejo);

/*------------------ AUTH ------------------*/
router.post("/auth/login", LoginDB);
router.get("/auth/validate", validateToken);

/*------------------ USERS (ADMIN) ------------------*/
router.get("/users", getDBLogin);
router.post("/users/add", setDBLogin);
router.get("/users/:id", getDBLoginID);
router.put("/users/:id", updateDBLogin);
router.delete("/users/:id", deleteDBLogin);

export default router;
