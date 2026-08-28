const { pool } = require('../config/db');
const NotifikasiModel = require('../models/notifikasi.model');

// Mengirim notifikasi dalam-aplikasi ke SEMUA pengguna aktif, KECUALI pelaku
// aksi itu sendiri (supaya tidak "menotifikasi diri sendiri" — konfirmasi aksi
// sudah ditampilkan lewat toast di frontend).
async function notifyAllExcept(actorId, { judul, pesan, tipe, modul, referensi_id }) {
  const [rows] = await pool.query(`SELECT id FROM users WHERE status = 'aktif' AND id != ?`, [actorId || 0]);
  for (const u of rows) {
    await NotifikasiModel.createForUser({
      user_id: u.id, dibuat_oleh: actorId, judul, pesan, tipe, modul, referensi_id,
    });
  }
}

// Mengirim notifikasi hanya ke pengguna dengan peran Super Admin.
async function notifySuperAdmins(actorId, { judul, pesan, tipe, modul, referensi_id }) {
  const [rows] = await pool.query(
    `SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id
     WHERE r.nama_role = 'Super Admin' AND u.status = 'aktif' AND u.id != ?`,
    [actorId || 0]
  );
  for (const u of rows) {
    await NotifikasiModel.createForUser({
      user_id: u.id, dibuat_oleh: actorId, judul, pesan, tipe, modul, referensi_id,
    });
  }
}

module.exports = { notifyAllExcept, notifySuperAdmins };
