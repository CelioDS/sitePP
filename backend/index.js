import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import userRoutes from "./Routes/router.js";
import userRoutesNeon from "./Routes/routerNeon.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

//cotas

// ✅ ESSENCIAL
app.use(express.urlencoded({ extended: true }));

// ----------------------
// 🔐 Segurança
// ----------------------
app.use(helmet());

// Rate limiting (100 reqs por 15 min por IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Muitas requisições deste IP, tente novamente mais tarde.",
});
app.use("/login", limiter);
app.use("/neon/login", limiter);

// ----------------------
// 🔧 Middlewares essenciais
// ----------------------
app.use(express.json({ limit: "10kb" }));

// ----------------------
// 🌐 CORS seguro
// ----------------------
const allowedOrigins = [
  "http://localhost:3000",

  ...(process.env.BACKEND_URL?.split(",") || []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("CORS bloqueado:", origin);

      return callback(new Error("CORS bloqueado: origem não permitida"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "login"],
  }),
);

// ----------------------
// 📌 Rotas
// ----------------------
app.use("/", userRoutes);
app.use("/neon", userRoutesNeon);

// ----------------------
// 🚀 Servidor
// ----------------------
const PORT = process.env.PORT || 8000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando em .0:${PORT}`);
});
