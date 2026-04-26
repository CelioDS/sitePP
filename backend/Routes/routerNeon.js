import express from "express";

import { getDBLoginNeon } from "../ControllersNeon/neon.js";

const router = express.Router();

router.get("/testes", getDBLoginNeon);

export default router;
