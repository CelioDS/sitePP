import express from "express";

import {
  getDBLogin,
  getDBLoginID,
  setDBLogin,
  updateDBLogin,
  deleteDBLogin,
} from "../Controllers/CreateUser.js";

import {
  getLP,
  getPAP,
  getPAP_PREMIUM,
  getPDU,
  getPduFull,
  getPDUMovel,
  getLP_grafico,
  getLP_graficoHistorico,
  getAPARELHO,
  getPduFullGrafico,
} from "../Controllers/Controllers.js";
import { LoginDB, validateToken } from "../Controllers/Auth.js";

import { setExcelLP, setExcelPAP, upload } from "../Controllers/ExcelUpload.js";

const router = express.Router();

/*------------------ LOJA PRÓPRIA ------------------*/
router.get("/", getLP);

router.get("/lojapropria", getLP);

router.get("/portaaporta", getPAP);

router.get("/pap_premium", getPAP_PREMIUM);

router.get("/pdu", getPDU);

router.get("/PduFull", getPduFull);
router.get("/PduFullGrafico", getPduFullGrafico);

router.get("/PduMovel", getPDUMovel);

router.get("/lojapropriaGrafico", getLP_grafico);

router.get("/lojapropriaGraficoHistorico", getLP_graficoHistorico);

router.get("/aparelho", getAPARELHO);

router.post("/upload-excel-lp", upload.single("file"), setExcelLP);

router.post("/upload-excel-PAP", upload.single("file"), setExcelPAP);

/*------------------ AUTH ------------------*/
router.post("/auth/login", LoginDB);
router.get("/auth/validate", validateToken);

/*------------------ USERS (ADMIN) ------------------*/
router.get("/users", getDBLogin);
router.get("/users/:id", getDBLoginID);

router.post("/users/add", setDBLogin);
router.put("/users/:id", updateDBLogin);
router.delete("/users/:id", deleteDBLogin);

export default router;
