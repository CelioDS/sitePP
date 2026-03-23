import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import userRoutes from "./Routes/router.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

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

// ----------------------
// 🔧 Middlewares essenciais
// ----------------------
app.use(express.json({ limit: "10kb" }));

// ----------------------
// 🌐 CORS seguro
// ----------------------
const allowedOrigins = [
  "http://localhost:3000",
  "http://10.69.152.193:3000",
  "https://ppspi.netlify.app",
  "http://192.168.1.9:3000",
  ...(process.env.FRONTEND_URL?.split(",") || []),
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

// ----------------------
// 🚀 Servidor
// ----------------------
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
