import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import userRoutes from "./Routes/router.js";
import userRoutesNeon from "./Routes/routerNeon.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10kb" }));
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use("/login", limiter);
app.use("/neon/login", limiter);

app.use(cors({ origin: true, credentials: true }));

app.use("/", userRoutes);
app.use("/neon", userRoutesNeon);

// ✅ NÃO USAR listen
export default app;