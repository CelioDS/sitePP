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

export default router;
