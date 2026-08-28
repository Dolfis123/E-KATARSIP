const { pool } = require('../config/db');

const NotifikasiModel = {
  async createForUser({ user_id, dibuat_oleh, judul, pesan, tipe, modul, referensi_id }) {
    const [result] = await pool.query(
      `INSERT INTO notifikasi (user_id, dibuat_oleh, judul, pesan, tipe, modul, referensi_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, dibuat_oleh || null, judul, pesan || null, tipe || 'info', modul || null, referensi_id || null]
    );
    return result.insertId;
  },

  async findForUser(userId, { limit = 15 } = {}) {
    const [rows] = await pool.query(
      `SELECT n.*, u.nama_lengkap AS dibuat_oleh_nama
       FROM notifikasi n
       LEFT JOIN users u ON n.dibuat_oleh = u.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC LIMIT ?`,
      [userId, Number(limit)]
    );
    return rows;
  },

  async countUnread(userId) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total FROM notifikasi WHERE user_id = ? AND dibaca = 0`,
      [userId]
    );
    return rows[0].total;
  },

  async markRead(id, userId) {
    await pool.query(`UPDATE notifikasi SET dibaca = 1 WHERE id = ? AND user_id = ?`, [id, userId]);
  },

  async markAllRead(userId) {
    await pool.query(`UPDATE notifikasi SET dibaca = 1 WHERE user_id = ? AND dibaca = 0`, [userId]);
  },
};

module.exports = NotifikasiModel;
