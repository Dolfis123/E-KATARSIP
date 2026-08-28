const { pool } = require('../config/db');

const OtpModel = {
  async create({ email, kode_hash, tipe, kedaluwarsa }) {
    const [result] = await pool.query(
      `INSERT INTO otp_codes (email, kode_hash, tipe, kedaluwarsa) VALUES (?, ?, ?, ?)`,
      [email, kode_hash, tipe, kedaluwarsa]
    );
    return result.insertId;
  },

  // Mengambil kode OTP aktif (belum dipakai, belum kedaluwarsa) TERBARU
  // untuk kombinasi email + tipe tertentu.
  async findLatestActive(email, tipe) {
    const [rows] = await pool.query(
      `SELECT * FROM otp_codes
       WHERE email = ? AND tipe = ? AND digunakan_pada IS NULL AND kedaluwarsa >= NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, tipe]
    );
    return rows[0];
  },

  async incrementAttempt(id) {
    await pool.query(`UPDATE otp_codes SET percobaan = percobaan + 1 WHERE id = ?`, [id]);
  },

  async markUsed(id) {
    await pool.query(`UPDATE otp_codes SET digunakan_pada = NOW() WHERE id = ?`, [id]);
  },

  // Membatalkan kode-kode lama yang belum dipakai untuk email+tipe yang sama,
  // supaya hanya kode paling baru yang berlaku (mencegah kebingungan pengguna).
  async invalidatePrevious(email, tipe) {
    await pool.query(
      `UPDATE otp_codes SET digunakan_pada = NOW()
       WHERE email = ? AND tipe = ? AND digunakan_pada IS NULL`,
      [email, tipe]
    );
  },
};

module.exports = OtpModel;
