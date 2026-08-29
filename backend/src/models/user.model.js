const { pool } = require('../config/db');

const UserModel = {
  async findByEmail(email) {
    const [rows] = await pool.query(
      `SELECT u.*, r.nama_role FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = ? LIMIT 1`,
      [email]
    );
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT u.id, u.nama_lengkap, u.nip, u.email, u.jabatan, u.sub_bidang, u.role_id,
              r.nama_role, u.foto_profil, u.status, u.email_terverifikasi, u.last_login, u.created_at
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? LIMIT 1`,
      [id]
    );
    return rows[0];
  },

  async findAll() {
    const [rows] = await pool.query(
      `SELECT u.id, u.nama_lengkap, u.nip, u.email, u.jabatan, u.sub_bidang, u.role_id,
              r.nama_role, u.status, u.email_terverifikasi, u.last_login, u.created_at
       FROM users u JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at DESC`
    );
    return rows;
  },

  async create({ nama_lengkap, nip, email, password, jabatan, role_id }) {
    const [result] = await pool.query(
      `INSERT INTO users (nama_lengkap, nip, email, password, jabatan, role_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [nama_lengkap, nip, email, password, jabatan, role_id]
    );
    return result.insertId;
  },

  async update(id, fields) {
    const keys = Object.keys(fields);
    if (keys.length === 0) return;
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const values = keys.map((k) => fields[k]);
    await pool.query(`UPDATE users SET ${setClause} WHERE id = ?`, [...values, id]);
  },

  async updateLastLogin(id) {
    await pool.query(`UPDATE users SET last_login = NOW() WHERE id = ?`, [id]);
  },

  async delete(id) {
    await pool.query(`DELETE FROM users WHERE id = ?`, [id]);
  },

  async countAll() {
    const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM users WHERE status='aktif'`);
    return rows[0].total;
  },
  // Tambahkan di dalam const UserModel = { ... }
  async findRoleById(roleId) {
    const [rows] = await pool.query(`SELECT nama_role FROM roles WHERE id = ? LIMIT 1`, [roleId]);
    return rows[0];
  },

  async countSuperAdmins() {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total FROM users u JOIN roles r ON u.role_id = r.id WHERE r.nama_role = 'Super Admin'`
    );
    return rows[0].total;
  },
};

module.exports = UserModel;
