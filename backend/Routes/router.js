import express from "express";

import {
  patchDB,
  getDBLogin,
  setDBLogin,
  updateDBLogin,
  deleteDBLogin,
  LoginDB,
  validateToken,
  getLP,
} from "../Controllers/Controllers.js";

import { setExcel, upload } from "../Controllers/ExcelUpload.js";

const router = express.Router();
/*------------------ AGENDAMENTO ------------------*/
router.patch("/:id", patchDB);

/*------------------ LOJA PRÓPRIA ------------------*/
router.get("/lojapropria", getLP);
router.post("/upload-excel-lp", upload.single("file"), setExcel);

/*------------------ AUTH ------------------*/
router.post("/auth/login", LoginDB);
router.get("/auth/validate", validateToken);

/*------------------ USERS (ADMIN) ------------------*/
router.get("/users", getDBLogin);
router.post("/users", setDBLogin);
router.put("/users/:id", updateDBLogin);
router.delete("/users/:id", deleteDBLogin);

export default router;
