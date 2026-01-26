import express from "express";

import {
  getDBLogin,
  setDBLogin,
  updateDBLogin,
  deleteDBLogin,
} from "../Controllers/CreateUser.js";

import { getLP, getPAP } from "../Controllers/Controllers.js";
import { LoginDB, validateToken } from "../Controllers/Auth.js";

import { setExcel, upload } from "../Controllers/ExcelUpload.js";

const router = express.Router();

/*------------------ LOJA PRÓPRIA ------------------*/
router.get("/", getLP);
router.get("/lojapropria", getLP);

router.get("/portaaporta", getPAP);

router.post("/upload-excel-lp", upload.single("file"), setExcel);

/*------------------ AUTH ------------------*/
router.post("/auth/login", LoginDB);
router.get("/auth/validate", validateToken);

/*------------------ USERS (ADMIN) ------------------*/
router.get("/users", getDBLogin);
router.post("/users/add", setDBLogin);
router.put("/users/:id", updateDBLogin);
router.delete("/users/:id", deleteDBLogin);

export default router;
