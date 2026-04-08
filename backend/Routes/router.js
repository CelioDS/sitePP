import express from "express";

import {
  getDBLogin,
  setDBLogin,
  patchDBLogin,
  getDBLoginID,
  deleteDBLogin,
  updateDBLogin,
} from "../Controllers/CreateUser.js";

import {
  getDBtarefas,
  setDBtarefas,
  ordenarTarefa,
  patchDBtarefas,
  getDBtarefasID,
  updateDBtarefas,
  deleteDBtarefas,
  setDBtarefasEtapas,
  patchDBtarefasEtapas,
  updateDBtarefasEtapas,
  deleteDBtarefasEtapas,
} from "../Controllers/Todo.js";

import {
  getAA,
  getLP,
  getPAP,
  getPDU,
  getPME,
  getCotas,
  getVAREJO,
  getFullPAP,
  getPduFull,
  getPDUMovel,
  getAPARELHO,
  getExclusivos,
  getLP_grafico,
  getPAP_grafico,
  getFullCarteiras,
  getVAREJO_grafico,
  getPduFullGrafico,
  getLP_graficoStatus,
  getStatusAtualizacao,
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
  setExcelExclusivos,
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
router.get("/exclusivos", getExclusivos);

/*------------------ ROTAS RAIZ ANALLITICAS ------------------*/

router.get("/cotas", getCotas);
router.get("/PduFull", getPduFull);
router.get("/Fullpap", getFullPAP);
router.get("/aparelho", getAPARELHO);
router.get("/PduMovel", getPDUMovel);
router.get("/FullCateiras", getFullCarteiras);
router.get("/VAREJOGrafico", getVAREJO_grafico);
router.get("/PduFullGrafico", getPduFullGrafico);
router.get("/lojapropriaGrafico", getLP_grafico);
router.get("/portaaportaGrafico", getPAP_grafico);
router.get("/statusatualizacao", getStatusAtualizacao);
router.get("/lojapropriaGraficoStatus", getLP_graficoStatus);
router.get("/VAREJOGraficoHistorico", getVAREJO_graficoHistorico);
router.get("/lojapropriaGraficoHistorico", getLP_graficoHistorico);

/*------------------ ROTAS RAIZ To Do ------------------*/
// PUT /todo/reorder
router.patch("/todo/reorder", ordenarTarefa);

router.get("/todo", getDBtarefas);
router.post("/todo/add", setDBtarefas);
router.get("/todo/:id", getDBtarefasID);
router.put("/todo/:id", updateDBtarefas);
router.patch("/todo/:id", patchDBtarefas);
router.delete("/todo/:id", deleteDBtarefas);

router.post("/todo/etapas/add", setDBtarefasEtapas);
router.put("/todo/etapas/:id", updateDBtarefasEtapas);
router.patch("/todo/etapas/:id", patchDBtarefasEtapas);
router.delete("/todo/etapas/:id", deleteDBtarefasEtapas);

/*------------------ EXCEL UPLOAD ------------------*/

router.post("/upload-excel-LP", upload.single("file"), setExcelLP);
router.post("/upload-excel-AA", upload.single("file"), setExcelAA);
router.post("/upload-excel-PME", upload.single("file"), setExcelPME);
router.post("/upload-excel-PAP", upload.single("file"), setExcelPAP);
router.post("/upload-excel-Varejo", upload.single("file"), setExcelVarejo);
router.post(
  "/upload-excel-EXCLUSIVOS",
  upload.single("file"),
  setExcelExclusivos,
);

/*------------------ AUTH ------------------*/
router.post("/auth/login", LoginDB);
router.get("/auth/validate", validateToken);

/*------------------ USERS (ADMIN) ------------------*/
router.get("/users", getDBLogin);
router.post("/users/add", setDBLogin);
router.get("/users/:id", getDBLoginID);
router.put("/users/:id", updateDBLogin);
router.patch("/users/:id", patchDBLogin);
router.delete("/users/:id", deleteDBLogin);

export default router;
