import express from "express";

import { getDBLoginNeon } from "../ControllersNeon/neon.js";
import { LoginDBNeon, validateTokenNeon } from "../ControllersNeon/authNeon.js";

const router = express.Router();

router.get("/users", getDBLoginNeon);

router.post("/auth/login", LoginDBNeon);
router.get("/auth/validate", validateTokenNeon);

export default router;
