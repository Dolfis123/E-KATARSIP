const { pool } = require('../config/db');

const ActivityLogModel = {
  async create({ user_id, aksi, modul, referensi_id, deskripsi, ip_address }) {
    await pool.query(
      `INSERT INTO activity_log (user_id, aksi, modul, referensi_id, deskripsi, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id || null, aksi, modul || null, referensi_id || null, deskripsi || null, ip_address || null]
    );
  },
  async findAll({ page = 1, limit = 20, modul, user_id } = {}) {
    const where = [];
    const params = [];
    if (modul) { where.push('l.modul = ?'); params.push(modul); }
    if (user_id) { where.push('l.user_id = ?'); params.push(user_id); }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (Number(page) - 1) * Number(limit);
    const [rows] = await pool.query(
      `SELECT l.*, u.nama_lengkap FROM activity_log l
       LEFT JOIN users u ON l.user_id = u.id
       ${whereClause} ORDER BY l.created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );
    const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM activity_log l ${whereClause}`, params);
    return { data: rows, total: countRows[0].total };
  },
};

module.exports = ActivityLogModel;
