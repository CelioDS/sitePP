import express from "express";

import {
  getDBLoginNeon,
  updateDBLoginNeon,
  setDBLoginNeon,
  patchDBLoginNeon,
  getCotasCop,
  importarCotasCopNeon,
  getPDU,
  getPDUMovel,
  getPduFull,
  getPduFullGrafico,
} from "../ControllersNeon/neon.js";

import { LoginDBNeon, validateTokenNeon } from "../ControllersNeon/authNeon.js";

import {
  getSuporteComercial,
  setSuporteComercial,
  patchSuporteComercial,
  getSuporteComercialID,
  deleteSuporteComercial,
  uploadSuporte,
} from "../ControllersNeon/HUB/controllersHub.js";

const router = express.Router();

router.get("/users", getDBLoginNeon);

router.post("/auth/login", LoginDBNeon);
router.get("/auth/validate", validateTokenNeon);

router.get("/PduFull", getPduFull);
router.get("/pdu", getPDU);
router.get("/PduMovel", getPDUMovel);
router.get("/PduFullGrafico", getPduFullGrafico);

router.get("/cotas-cop", getCotasCop);
router.get("/importar-cotas-cop", importarCotasCopNeon);
1;
// routerNeon.js
router.patch("/users/:id", patchDBLoginNeon);

/**SUPORTE COMERCIAL */

router.get("/suportecomercial", getSuporteComercial);
router.get("/suportecomercial/:id", getSuporteComercialID);
router.post(
  "/suportecomercial/add",
  uploadSuporte.single("anexo"),
  setSuporteComercial,
);
router.patch(
  "/suportecomercial/:id",
  uploadSuporte.single("responsavel_anexo"), // ✅ ADD AQUI
  patchSuporteComercial,
);
router.delete("/suportecomercial/:id", deleteSuporteComercial);

export default router;
