import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Criando o pool de conexões
export const dataBase = mysql.createPool({
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

// Testando a conexão (Forma correta para 'promise')
const testConnection = async () => {
  try {
    const connection = await dataBase.getConnection();
    console.log("✅ Conexão bem-sucedida!");
    connection.release();
  } catch (err) {
    console.error("❌ Erro ao conectar ao banco de dados:", err.message);
  }
};

testConnection();
