const path = require('path');
const fs = require('fs');
const ArsipModel = require('../models/arsip.model');
const LampiranModel = require('../models/lampiran.model');
const ActivityLogModel = require('../models/activityLog.model');

const RETENSI_HARI = 30;

// Menghapus permanen seluruh arsip yang sudah berada di Sampah lebih dari
// RETENSI_HARI hari, beserta berkas fisik lampirannya. Dipanggil secara
// terjadwal (lihat server.js) dan sekali saat server baru dinyalakan.
async function purgeExpiredTrash() {
  try {
    const expired = await ArsipModel.findExpiredTrash(RETENSI_HARI);
    if (!expired.length) return;

    for (const { id } of expired) {
      const lampiranList = await LampiranModel.findByArsipId(id);
      for (const l of lampiranList) {
        if (l.jenis_lampiran === 'file' && l.nama_file) {
          const filePath = path.join(__dirname, '..', 'uploads', 'arsip', l.nama_file);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      }
      await ArsipModel.delete(id); // cascades ke arsip_lampiran via FK ON DELETE CASCADE
      await ActivityLogModel.create({
        user_id: null, aksi: 'HAPUS_PERMANEN_ARSIP', modul: 'arsip', referensi_id: id,
        deskripsi: `Arsip ID ${id} dihapus permanen otomatis oleh sistem (lebih dari ${RETENSI_HARI} hari di Sampah)`,
        ip_address: null,
      });
    }

    console.log(`🗑️  Pembersihan Sampah: ${expired.length} arsip dihapus permanen (>${RETENSI_HARI} hari).`);
  } catch (err) {
    console.error('❌ Gagal menjalankan pembersihan Sampah otomatis:', err.message);
  }
}

module.exports = { purgeExpiredTrash, RETENSI_HARI };
