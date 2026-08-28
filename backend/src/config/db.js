const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ekatarsip_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Koneksi database MySQL berhasil.');
    conn.release();
  } catch (err) {
    console.error('❌ Gagal koneksi ke database MySQL:', err.message);
  }
}

module.exports = { pool, testConnection };
