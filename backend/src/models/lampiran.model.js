const { pool } = require('../config/db');

const LampiranModel = {
  async create({
    arsip_id, jenis_lampiran, nama_file, nama_file_asli, path_file,
    tipe_file, ukuran_file_kb, checksum_sha256, diunggah_oleh,
  }) {
    const [result] = await pool.query(
      `INSERT INTO arsip_lampiran
        (arsip_id, jenis_lampiran, nama_file, nama_file_asli, path_file, tipe_file, ukuran_file_kb, checksum_sha256, diunggah_oleh)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        arsip_id, jenis_lampiran || 'file', nama_file || null, nama_file_asli, path_file,
        tipe_file || null, ukuran_file_kb === undefined ? null : ukuran_file_kb, checksum_sha256 || null, diunggah_oleh,
      ]
    );
    return result.insertId;
  },
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM arsip_lampiran WHERE id = ?', [id]);
    return rows[0];
  },
  async findByArsipId(arsipId) {
    const [rows] = await pool.query('SELECT * FROM arsip_lampiran WHERE arsip_id = ?', [arsipId]);
    return rows;
  },
  async delete(id) {
    await pool.query('DELETE FROM arsip_lampiran WHERE id = ?', [id]);
  },
};

module.exports = LampiranModel;
