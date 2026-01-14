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
  "https://agendamentoclaro.netlify.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // permite requests sem origin (Postman, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
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
