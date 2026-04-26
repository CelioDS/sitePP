import pg from "pg";
import dotenv from "dotenv"; // Corrigido: dotenv

dotenv.config(); // Corrigido: dotenv

if (!process.env.NEON_DATABASE_URL) {
  throw new Error(
    "🚨 FATAL: NEON_DATABASE_URL não definida nos Environment Variables da Vercel!",
  );
}

export const neonDB = new pg.Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  // Adicione isso para evitar que ele tente o padrão local
  host: process.env.NEON_DATABASE_URL.split("@")[1]?.split("/")[0] || undefined,
});

neonDB.query("SELECT NOW()", (err, res) => {
  if (err) {
    // Corrigido: vírgula para separar os argumentos e ortografia
    console.error("❌ Erro no Neon Cloud:", err.message);
  } else {
    console.log("☁️ Conectado ao NEON com sucesso!");
  }
});
