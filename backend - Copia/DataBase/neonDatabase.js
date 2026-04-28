import pg from "pg";
import dotenv from "dotenv"; // Corrigido: dotenv

dotenv.config(); // Corrigido: dotenv

export const neonDB = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

neonDB.query("SELECT NOW()", (err, res) => {
  if (err) {
    // Corrigido: vírgula para separar os argumentos e ortografia
    console.error("❌ Erro no Neon Cloud:", err.message);
  } else {
    console.log("☁️ Conectado ao NEON com sucesso!");
  }
});