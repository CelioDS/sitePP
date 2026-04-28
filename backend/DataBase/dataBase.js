import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// 1. Iniciamos a variável como nula
let dataBase = null;

// 2. Só cria o pool e testa a conexão se NÃO estiver na Vercel
if (process.env.NODE_ENV !== "production") {
  dataBase = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: "-03:00",
  });

  // Testando a conexão
  const testConnection = async () => {
    try {
      const connection = await dataBase.getConnection();
      console.log("✅ Conexão MySQL (Local) bem-sucedida!");
      connection.release();
    } catch (err) {
      console.error("❌ Erro ao conectar ao MySQL (Local):", err.message);
    }
  };

  testConnection();
}

// 3. Exportamos a variável
export { dataBase };