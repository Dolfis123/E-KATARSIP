const { pool } = require('../config/db');

// Model gabungan untuk data master: sektor, jenis_dokumen, opd, roles
const MasterModel = {
  sektor: {
    async findAll() {
      const [rows] = await pool.query('SELECT * FROM sektor ORDER BY nama_sektor ASC');
      return rows;
    },
    async create(nama_sektor, kode_sektor) {
      const [r] = await pool.query('INSERT INTO sektor (nama_sektor, kode_sektor) VALUES (?, ?)', [nama_sektor, kode_sektor]);
      return r.insertId;
    },
    async delete(id) {
      await pool.query('DELETE FROM sektor WHERE id = ?', [id]);
    },
  },
  jenisDokumen: {
    async findAll() {
      const [rows] = await pool.query('SELECT * FROM jenis_dokumen ORDER BY nama_jenis ASC');
      return rows;
    },
    async findById(id) {
      const [rows] = await pool.query('SELECT * FROM jenis_dokumen WHERE id = ?', [id]);
      return rows[0];
    },
    async create(nama_jenis, kode_jenis, masa_retensi_tahun) {
      const [r] = await pool.query(
        'INSERT INTO jenis_dokumen (nama_jenis, kode_jenis, masa_retensi_tahun) VALUES (?, ?, ?)',
        [nama_jenis, kode_jenis, masa_retensi_tahun || 5]
      );
      return r.insertId;
    },
    async delete(id) {
      await pool.query('DELETE FROM jenis_dokumen WHERE id = ?', [id]);
    },
  },
  opd: {
    async findAll() {
      const [rows] = await pool.query('SELECT * FROM opd ORDER BY nama_opd ASC');
      return rows;
    },
    async findById(id) {
      const [rows] = await pool.query('SELECT * FROM opd WHERE id = ?', [id]);
      return rows[0];
    },
    async create({ nama_opd, singkatan, kontak_person, email, telepon }) {
      const [r] = await pool.query(
        'INSERT INTO opd (nama_opd, singkatan, kontak_person, email, telepon) VALUES (?, ?, ?, ?, ?)',
        [nama_opd, singkatan, kontak_person, email, telepon]
      );
      return r.insertId;
    },
    async update(id, fields) {
      const keys = Object.keys(fields);
      if (!keys.length) return;
      const setClause = keys.map((k) => `${k} = ?`).join(', ');
      await pool.query(`UPDATE opd SET ${setClause} WHERE id = ?`, [...keys.map((k) => fields[k]), id]);
    },
    async delete(id) {
      await pool.query('DELETE FROM opd WHERE id = ?', [id]);
    },
  },
  roles: {
    async findAll() {
      const [rows] = await pool.query('SELECT * FROM roles ORDER BY id ASC');
      return rows;
    },
  },
};

module.exports = MasterModel;
