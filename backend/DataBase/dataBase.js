import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

let dataBase = null;

// Só tenta criar o pool e testar se NÃO estiver na Vercel
if (process.env.NODE_ENV !== "production") {
  
  dataBase = mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    port: 3307,
    password: "",
    database: "db_projetos",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: "-03:00",
  });

  const testConnection = async () => {
    try {
      const connection = await dataBase.getConnection();
      console.log("✅ Conexão Local (XAMPP) bem-sucedida!");
      connection.release();
    } catch (err) {
      console.error("❌ Erro ao conectar ao MySQL Local:", err.message);
    }
  };

  testConnection();
}

export { dataBase };