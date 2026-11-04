const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "pesque_fale",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4_unicode_ci",
});

async function verificarConexao() {
  const conexao = await pool.getConnection();
  try {
    await conexao.query("SELECT 1");
    return true;
  } finally {
    conexao.release();
  }
}

module.exports = { pool, verificarConexao };
