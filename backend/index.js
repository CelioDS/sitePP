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
// 🌐 CORS seguro
// ----------------------
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://ppspi.netlify.app",
  ...(process.env.BACKEND_URL?.split(",").map((url) => url.trim()) || []),
];

const corsOptions = {
  origin: (origin, callback) => {
    console.log("Origem recebida:", origin);

    // Permite Postman, servidor interno, health checks etc.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error("CORS bloqueado:", origin);

    // Melhor não usar new Error aqui em produção
    return callback(null, false);
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "login",
    "Origin",
    "Accept",
  ],

  optionsSuccessStatus: 204,
};

// CORS precisa vir antes das rotas
app.use(cors(corsOptions));

// Libera preflight OPTIONS
app.options(/.*/, cors(corsOptions));

// ----------------------
// 🔐 Segurança
// ----------------------
app.use(helmet());

// ----------------------
// 🔧 Middlewares essenciais
// ----------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10kb" }));

// ----------------------
// 🚧 Rate limiting
// ----------------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Muitas requisições deste IP, tente novamente mais tarde.",
});

// Suas rotas reais parecem ser essas:
app.use("/login", limiter);
app.use("/neon/login", limiter);
app.use("/neon/auth/login", limiter);

// ----------------------
// 📌 Rotas
// ----------------------
app.use("/", userRoutes);
app.use("/neon", userRoutesNeon);

// ----------------------
// Teste simples
// ----------------------
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "API rodando",
    allowedOrigins,
  });
});

if (process.env.NODE_ENV !== "production") {
  await import("./jobs/importCotasCopAutomatico.job.js");
}

// ----------------------
// 🚀 Servidor
// ----------------------
export default app;

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 8000;

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando localmente na porta ${PORT}`);
  });
}
