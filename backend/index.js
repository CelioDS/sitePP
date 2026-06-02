import cors from "cors";
import path from "path";
import helmet from "helmet";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import userRoutes from "./Routes/router.js";
import userRoutesNeon from "./Routes/routerNeon.js";

dotenv.config();

const app = express();

// ----------------------
// 🔐 Segurança
// ----------------------
app.use(helmet());

// ----------------------
// 🔧 Body parser
// ----------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10kb" }));

// ----------------------
// 🌐 CORS LIBERADO TOTAL (SEM ERRO)
// ----------------------
app.use(cors());

// ✅ garante preflight (SEM usar app.options "*")
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, login"
  );

  // intercepta preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ----------------------
// 🚫 Rate limit
// ----------------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Muitas requisições deste IP, tente novamente mais tarde.",
});

app.use("/login", limiter);
app.use("/neon/login", limiter);

// ----------------------
// 📂 Arquivos estáticos
// ----------------------
app.use("/uploads", express.static(path.resolve("uploads")));

// ----------------------
// 📌 Rotas
// ----------------------
app.use("/", userRoutes);
app.use("/neon", userRoutesNeon);

// ----------------------
// ⚙️ Jobs (apenas local)
// ----------------------
if (process.env.NODE_ENV !== "production") {
  await import("./jobs/importCotasCopAutomatico.job.js");
}

// ----------------------
// 🚀 Export (Vercel)
// ----------------------
export default app;

// ----------------------
// 🖥️ Server local
// ----------------------
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 8000;

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}