const { pool } = require('../config/db');

const BASE_SELECT = `
  SELECT a.*, jd.nama_jenis, jd.kode_jenis, s.nama_sektor, o.nama_opd,
         u1.nama_lengkap AS diinput_oleh_nama,
         (SELECT COUNT(*) FROM arsip_lampiran al WHERE al.arsip_id = a.id) AS jumlah_lampiran
  FROM arsip a
  LEFT JOIN jenis_dokumen jd ON a.jenis_dokumen_id = jd.id
  LEFT JOIN sektor s ON a.sektor_id = s.id
  LEFT JOIN opd o ON a.opd_terkait_id = o.id
  LEFT JOIN users u1 ON a.diinput_oleh = u1.id
`;

const ArsipModel = {
  async findAndFilter({ search, jenis_dokumen_id, sektor_id, tahun, page = 1, limit = 12 }) {
    const where = ['a.dihapus_pada IS NULL'];
    const params = [];

    if (search) {
      where.push('(a.judul LIKE ? OR a.uraian_ringkas LIKE ? OR a.kata_kunci LIKE ? OR a.nomor_klasifikasi LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (jenis_dokumen_id) {
      where.push('a.jenis_dokumen_id = ?');
      params.push(jenis_dokumen_id);
    }
    if (sektor_id) {
      where.push('a.sektor_id = ?');
      params.push(sektor_id);
    }
    if (tahun) {
      where.push('YEAR(a.tanggal_dokumen) = ?');
      params.push(tahun);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (Number(page) - 1) * Number(limit);

    const [rows] = await pool.query(
      `${BASE_SELECT} ${whereClause} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM arsip a ${whereClause}`,
      params
    );
    return { data: rows, total: countRows[0].total };
  },

  async findById(id) {
    const [rows] = await pool.query(`${BASE_SELECT} WHERE a.id = ? AND a.dihapus_pada IS NULL`, [id]);
    if (!rows[0]) return null;
    const [lampiran] = await pool.query('SELECT * FROM arsip_lampiran WHERE arsip_id = ? ORDER BY created_at DESC', [id]);
    return { ...rows[0], lampiran };
  },

  // Sama seperti findById, tetapi TIDAK menyaring arsip yang sudah berada di
  // Sampah — dipakai khusus untuk alur pulihkan/hapus permanen.
  async findByIdAny(id) {
    const [rows] = await pool.query(`${BASE_SELECT} WHERE a.id = ?`, [id]);
    if (!rows[0]) return null;
    const [lampiran] = await pool.query('SELECT * FROM arsip_lampiran WHERE arsip_id = ? ORDER BY created_at DESC', [id]);
    return { ...rows[0], lampiran };
  },

  async create(data) {
    const {
      nomor_klasifikasi, judul, jenis_dokumen_id, sektor_id, tanggal_dokumen,
      nomor_surat, uraian_ringkas, opd_terkait_id, lokasi_fisik, tingkat_kerahasiaan,
      kata_kunci, diinput_oleh,
    } = data;
    const [result] = await pool.query(
      `INSERT INTO arsip (nomor_klasifikasi, judul, jenis_dokumen_id, sektor_id, tanggal_dokumen,
        nomor_surat, uraian_ringkas, opd_terkait_id, lokasi_fisik, tingkat_kerahasiaan, kata_kunci,
        diinput_oleh)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nomor_klasifikasi, judul, jenis_dokumen_id, sektor_id || null, tanggal_dokumen,
        nomor_surat || null, uraian_ringkas || null, opd_terkait_id || null,
        lokasi_fisik || 'Ruang Sub Bidang Ekonomi & Sosbud', tingkat_kerahasiaan || 'biasa',
        kata_kunci || null, diinput_oleh]
    );
    return result.insertId;
  },

  async update(id, fields) {
    const keys = Object.keys(fields);
    if (keys.length === 0) return;
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const values = keys.map((k) => fields[k]);
    await pool.query(`UPDATE arsip SET ${setClause} WHERE id = ?`, [...values, id]);
  },

  // Hapus permanen (DB row + cascading lampiran via FK). Dipakai hanya oleh
  // endpoint "Hapus Permanen" dari Sampah dan oleh job pembersihan otomatis.
  async delete(id) {
    await pool.query(`DELETE FROM arsip WHERE id = ?`, [id]);
  },

  // Soft-delete: memindahkan arsip ke Sampah.
  async softDelete(id) {
    await pool.query(`UPDATE arsip SET dihapus_pada = NOW() WHERE id = ?`, [id]);
  },

  // Memulihkan arsip dari Sampah.
  async restore(id) {
    await pool.query(`UPDATE arsip SET dihapus_pada = NULL WHERE id = ?`, [id]);
  },

  async findTrash({ ownerId, page = 1, limit = 12 } = {}) {
    const where = ['a.dihapus_pada IS NOT NULL'];
    const params = [];
    if (ownerId) {
      where.push('a.diinput_oleh = ?');
      params.push(ownerId);
    }
    const whereClause = `WHERE ${where.join(' AND ')}`;
    const offset = (Number(page) - 1) * Number(limit);
    const [rows] = await pool.query(
      `${BASE_SELECT} ${whereClause} ORDER BY a.dihapus_pada DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );
    const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM arsip a ${whereClause}`, params);
    return { data: rows, total: countRows[0].total };
  },

  // Arsip yang sudah berada di Sampah lebih dari `days` hari — dipakai oleh
  // job pembersihan otomatis (default 30 hari).
  async findExpiredTrash(days = 30) {
    const [rows] = await pool.query(
      `SELECT id FROM arsip WHERE dihapus_pada IS NOT NULL AND dihapus_pada < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );
    return rows;
  },

  async incrementViews(id) {
    await pool.query(`UPDATE arsip SET jumlah_dilihat = jumlah_dilihat + 1 WHERE id = ?`, [id]);
  },

  async incrementDownloads(id) {
    await pool.query(`UPDATE arsip SET jumlah_diunduh = jumlah_diunduh + 1 WHERE id = ?`, [id]);
  },

  async countByNomorPrefix(prefix) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total FROM arsip WHERE nomor_klasifikasi LIKE ?`,
      [`${prefix}%`]
    );
    return rows[0].total;
  },

  // --- Dashboard aggregates (semua menyaring arsip yang ada di Sampah) ---
  async countAll() {
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM arsip WHERE dihapus_pada IS NULL');
    return rows[0].total;
  },
  async countBySektor() {
    const [rows] = await pool.query(
      `SELECT s.nama_sektor, COUNT(a.id) AS total FROM sektor s
       LEFT JOIN arsip a ON a.sektor_id = s.id AND a.dihapus_pada IS NULL GROUP BY s.id ORDER BY total DESC`
    );
    return rows;
  },
  async countByJenis() {
    const [rows] = await pool.query(
      `SELECT jd.nama_jenis, COUNT(a.id) AS total FROM jenis_dokumen jd
       LEFT JOIN arsip a ON a.jenis_dokumen_id = jd.id AND a.dihapus_pada IS NULL GROUP BY jd.id ORDER BY total DESC`
    );
    return rows;
  },
  async trendPerBulan() {
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS bulan, COUNT(*) AS total
       FROM arsip WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH) AND dihapus_pada IS NULL
       GROUP BY bulan ORDER BY bulan ASC`
    );
    return rows;
  },
  async recent(limit = 5) {
    const [rows] = await pool.query(`${BASE_SELECT} WHERE a.dihapus_pada IS NULL ORDER BY a.created_at DESC LIMIT ?`, [limit]);
    return rows;
  },
};

module.exports = ArsipModel;
