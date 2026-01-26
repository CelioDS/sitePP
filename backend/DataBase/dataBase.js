import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config(); // <-- Carrega o arquivo .env

export const dataBase = mysql
  .createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    connectTimeout: 10000,
    /*
  host : "db4free.net",
  user : "teste01ada",
  password : "PZXvAFdxa.bh2Yg",
  database : "teste01ada",
  */
  })

dataBase.getConnection((err, connection) => {
  if (err) {
    console.error("ERROR ao conectar ao banco de dados", err);
    return;
  }
  console.log("Conexão bem-sucedida ao banco de dados");
  connection.release(); // devolve a conexão ao pool
});
