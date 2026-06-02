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
    // Permite Postman, Insomnia, curl e chamadas sem origin
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error("CORS bloqueado:", origin);
    return callback(new Error("CORS bloqueado: origem não permitida"));
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "login",
    "Accept",
    "Origin",
    "X-Requested-With",
  ],

  optionsSuccessStatus: 204,
};

// ✅ CORS precisa vir antes de tudo
app.use(cors(corsOptions));

// ✅ Preflight OPTIONS
app.options(/.*/, cors(corsOptions));

// ----------------------
// 🔧 Middlewares essenciais
// ----------------------
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ----------------------
// 🔐 Segurança
// ----------------------
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Muitas requisições deste IP, tente novamente mais tarde.",
});

// Ajuste conforme suas rotas reais
app.use("/login", limiter);
app.use("/neon/login", limiter);
app.use("/neon/auth/login", limiter);

// ----------------------
// 📌 Rotas
// ----------------------
app.use("/uploads", express.static(path.resolve("uploads")));

app.use("/", userRoutes);
app.use("/neon", userRoutesNeon);

// ----------------------
// Jobs locais
// ----------------------
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