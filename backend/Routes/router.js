import express from "express";

import {
  getDB,
  setDB,
  updateDB,
  patchDB,
  deleteDB,
  getDBLogin,
  setDBLogin,
  updateDBLogin,
  deleteDBLogin,
  LoginDB,
  validateToken,
  getLP
} from "../Controllers/Controllers.js";

const router = express.Router();

router.get("/", getDB);

router.post("/", setDB);

router.put("/:id", updateDB);
router.patch("/:id", patchDB);

router.delete("/:id", deleteDB);

/*--------------------query LP--------------------*/
router.get("/lojapropria", getLP);



/*---------------LOGIN CRUD-------------------------- */

router.get("/login", getDBLogin);

router.post("/login/add", setDBLogin); // cria usuário

router.put("/login/:id", updateDBLogin);

router.delete("/login/:id", deleteDBLogin);

//-------------------- LOGIN  -----------------
router.post("/login", LoginDB); // login normal

router.get("/validate-token", validateToken);

export default router;
