const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const ArsipModel = require('../models/arsip.model');
const LampiranModel = require('../models/lampiran.model');
const MasterModel = require('../models/master.model');
const ActivityLogModel = require('../models/activityLog.model');
const { notifyAllExcept } = require('../utils/notify');

// Menghasilkan nomor klasifikasi otomatis: KODEJENIS/KODESEKTOR/NNN/BULAN-ROMAWI/TAHUN
const BULAN_ROMAWI = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

async function generateNomorKlasifikasi(jenis_dokumen_id, sektor_id) {
  const jenis = await MasterModel.jenisDokumen.findById(jenis_dokumen_id);
  const now = new Date();
  const tahun = now.getFullYear();
  const bulanRomawi = BULAN_ROMAWI[now.getMonth()];

  let kodeSektor = 'UMU';
  if (sektor_id) {
    const sektorList = await MasterModel.sektor.findAll();
    const found = sektorList.find((s) => s.id === Number(sektor_id));
    if (found) kodeSektor = found.kode_sektor;
  }

  const prefix = `${jenis.kode_jenis}/${kodeSektor}/`;
  const countExisting = await ArsipModel.countByNomorPrefix(prefix);
  const urut = String(countExisting + 1).padStart(3, '0');
  return `${jenis.kode_jenis}/${kodeSektor}/${urut}/${bulanRomawi}/${tahun}`;
}

// Validasi sederhana: tautan harus URL http/https yang wajar.
function isValidUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// Mengurai field "links" dari body (dikirim sebagai string JSON melalui
// multipart/form-data, atau sebagai array biasa melalui JSON biasa).
// Bentuk tiap item: { label, url }
function parseLinksInput(rawLinks) {
  if (!rawLinks) return [];
  let arr = rawLinks;
  if (typeof rawLinks === 'string') {
    try {
      arr = JSON.parse(rawLinks);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => ({ label: (item.label || '').trim(), url: (item.url || '').trim() }))
    .filter((item) => item.url && isValidUrl(item.url));
}

// Boleh mengubah/menghapus arsip jika Super Admin, atau pemilik (penginput) arsip.
function canManageArsip(user, arsip) {
  return user.nama_role === 'Super Admin' || arsip.diinput_oleh === user.id;
}

exports.list = async (req, res, next) => {
  try {
    const { search, jenis_dokumen_id, sektor_id, tahun, page, limit } = req.query;
    const result = await ArsipModel.findAndFilter({ search, jenis_dokumen_id, sektor_id, tahun, page, limit });
    res.json({ success: true, data: result.data, pagination: { total: result.total, page: Number(page) || 1, limit: Number(limit) || 12 } });
  } catch (err) {
    next(err);
  }
};

exports.detail = async (req, res, next) => {
  try {
    const arsip = await ArsipModel.findById(req.params.id);
    if (!arsip) return res.status(404).json({ success: false, message: 'Arsip tidak ditemukan.' });
    await ArsipModel.incrementViews(req.params.id);
    res.json({ success: true, data: arsip });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { judul, jenis_dokumen_id, sektor_id, tanggal_dokumen, nomor_surat, uraian_ringkas, opd_terkait_id, lokasi_fisik, tingkat_kerahasiaan, kata_kunci, links } = req.body;

    if (!judul || !jenis_dokumen_id || !tanggal_dokumen) {
      return res.status(400).json({ success: false, message: 'Judul, jenis dokumen, dan tanggal dokumen wajib diisi.' });
    }

    const nomor_klasifikasi = await generateNomorKlasifikasi(jenis_dokumen_id, sektor_id);

    const arsipId = await ArsipModel.create({
      nomor_klasifikasi, judul, jenis_dokumen_id, sektor_id, tanggal_dokumen, nomor_surat,
      uraian_ringkas, opd_terkait_id, lokasi_fisik, tingkat_kerahasiaan, kata_kunci,
      diinput_oleh: req.user.id,
    });

    // Simpan lampiran file jika ada yang diunggah bersamaan
    if (req.files && req.files.length) {
      for (const file of req.files) {
        const buffer = fs.readFileSync(file.path);
        const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
        await LampiranModel.create({
          arsip_id: arsipId,
          jenis_lampiran: 'file',
          nama_file: file.filename,
          nama_file_asli: file.originalname,
          path_file: `/uploads/arsip/${file.filename}`,
          tipe_file: file.mimetype,
          ukuran_file_kb: Math.round(file.size / 1024),
          checksum_sha256: checksum,
          diunggah_oleh: req.user.id,
        });
      }
    }

    // Simpan lampiran berupa tautan (Google Drive, dsb.) jika disertakan
    const parsedLinks = parseLinksInput(links);
    for (const link of parsedLinks) {
      await LampiranModel.create({
        arsip_id: arsipId,
        jenis_lampiran: 'link',
        nama_file_asli: link.label || link.url,
        path_file: link.url,
        tipe_file: 'link',
        diunggah_oleh: req.user.id,
      });
    }

    await ActivityLogModel.create({
      user_id: req.user.id, aksi: 'TAMBAH_ARSIP', modul: 'arsip', referensi_id: arsipId,
      deskripsi: `Menambahkan arsip baru: "${judul}" (${nomor_klasifikasi})`, ip_address: req.ip,
    });
    await notifyAllExcept(req.user.id, {
      judul: 'Arsip baru ditambahkan',
      pesan: `${req.user.nama_lengkap} menambahkan arsip "${judul}" (${nomor_klasifikasi})`,
      tipe: 'arsip', modul: 'arsip', referensi_id: arsipId,
    });

    const arsip = await ArsipModel.findById(arsipId);
    res.status(201).json({ success: true, message: 'Arsip berhasil ditambahkan.', data: arsip });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await ArsipModel.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Arsip tidak ditemukan.' });

    if (!canManageArsip(req.user, existing)) {
      return res.status(403).json({ success: false, message: 'Anda hanya dapat mengubah arsip yang Anda input sendiri.' });
    }

    const allowedFields = ['judul', 'sektor_id', 'tanggal_dokumen', 'nomor_surat', 'uraian_ringkas', 'opd_terkait_id', 'lokasi_fisik', 'tingkat_kerahasiaan', 'kata_kunci'];
    // Kolom FK opsional (sektor_id, opd_terkait_id) harus disimpan sebagai NULL,
    // bukan string kosong — string kosong dipaksa MySQL menjadi 0 dan menabrak
    // foreign key constraint karena tidak ada baris sektor/opd dengan id=0.
    const nullableForeignKeys = ['sektor_id', 'opd_terkait_id'];
    const fields = {};
    for (const f of allowedFields) {
      if (req.body[f] === undefined) continue;
      const value = req.body[f];
      fields[f] = nullableForeignKeys.includes(f) && value === '' ? null : value;
    }

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada data yang diubah.' });
    }

    await ArsipModel.update(id, fields);
    await ActivityLogModel.create({
      user_id: req.user.id, aksi: 'UBAH_ARSIP', modul: 'arsip', referensi_id: id,
      deskripsi: `Mengubah data arsip "${existing.judul}"`, ip_address: req.ip,
    });
    await notifyAllExcept(req.user.id, {
      judul: 'Arsip diperbarui',
      pesan: `${req.user.nama_lengkap} mengubah data arsip "${existing.judul}"`,
      tipe: 'arsip', modul: 'arsip', referensi_id: id,
    });

    const updated = await ArsipModel.findById(id);
    res.json({ success: true, message: 'Arsip berhasil diperbarui.', data: updated });
  } catch (err) {
    next(err);
  }
};

// Memindahkan arsip ke Sampah (soft-delete). Arsip TIDAK langsung dihapus
// dari database maupun berkas fisiknya — baru dihapus permanen jika pengguna
// menghapusnya lagi dari halaman Sampah, atau otomatis setelah 30 hari.
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await ArsipModel.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Arsip tidak ditemukan.' });

    if (!canManageArsip(req.user, existing)) {
      return res.status(403).json({ success: false, message: 'Anda hanya dapat menghapus arsip yang Anda input sendiri.' });
    }

    await ArsipModel.softDelete(id);
    await ActivityLogModel.create({
      user_id: req.user.id, aksi: 'HAPUS_ARSIP', modul: 'arsip', referensi_id: id,
      deskripsi: `Memindahkan arsip "${existing.judul}" (${existing.nomor_klasifikasi}) ke Sampah`, ip_address: req.ip,
    });
    await notifyAllExcept(req.user.id, {
      judul: 'Arsip dipindahkan ke Sampah',
      pesan: `${req.user.nama_lengkap} memindahkan arsip "${existing.judul}" ke Sampah`,
      tipe: 'arsip', modul: 'arsip', referensi_id: id,
    });
    res.json({ success: true, message: 'Arsip dipindahkan ke Sampah. Dapat dipulihkan dalam 30 hari sebelum dihapus permanen.' });
  } catch (err) {
    next(err);
  }
};

// GET /arsip/sampah — daftar arsip di Sampah (Super Admin melihat semua,
// Staf Admin hanya melihat miliknya sendiri).
exports.trashList = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const ownerId = req.user.nama_role === 'Super Admin' ? null : req.user.id;
    const result = await ArsipModel.findTrash({ ownerId, page, limit });
    res.json({ success: true, data: result.data, pagination: { total: result.total, page: Number(page) || 1, limit: Number(limit) || 12 } });
  } catch (err) {
    next(err);
  }
};

// POST /arsip/:id/pulihkan — memulihkan arsip dari Sampah.
exports.restore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await ArsipModel.findByIdAny(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Arsip tidak ditemukan.' });
    if (!existing.dihapus_pada) return res.status(400).json({ success: false, message: 'Arsip ini tidak berada di Sampah.' });
    if (!canManageArsip(req.user, existing)) {
      return res.status(403).json({ success: false, message: 'Anda hanya dapat memulihkan arsip yang Anda input sendiri.' });
    }

    await ArsipModel.restore(id);
    await ActivityLogModel.create({
      user_id: req.user.id, aksi: 'PULIHKAN_ARSIP', modul: 'arsip', referensi_id: id,
      deskripsi: `Memulihkan arsip "${existing.judul}" (${existing.nomor_klasifikasi}) dari Sampah`, ip_address: req.ip,
    });
    await notifyAllExcept(req.user.id, {
      judul: 'Arsip dipulihkan',
      pesan: `${req.user.nama_lengkap} memulihkan arsip "${existing.judul}" dari Sampah`,
      tipe: 'arsip', modul: 'arsip', referensi_id: id,
    });
    res.json({ success: true, message: 'Arsip berhasil dipulihkan.' });
  } catch (err) {
    next(err);
  }
};

// DELETE /arsip/:id/permanen — menghapus permanen arsip yang SUDAH berada di
// Sampah (beserta seluruh berkas fisik lampirannya). Tindakan ini tidak dapat
// dibatalkan.
exports.permanentDelete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await ArsipModel.findByIdAny(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Arsip tidak ditemukan.' });
    if (!existing.dihapus_pada) {
      return res.status(400).json({ success: false, message: 'Arsip harus dipindahkan ke Sampah terlebih dahulu sebelum dihapus permanen.' });
    }
    if (!canManageArsip(req.user, existing)) {
      return res.status(403).json({ success: false, message: 'Anda hanya dapat menghapus permanen arsip yang Anda input sendiri.' });
    }

    for (const l of existing.lampiran) {
      if (l.jenis_lampiran === 'file' && l.nama_file) {
        const filePath = path.join(__dirname, '..', 'uploads', 'arsip', l.nama_file);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }

    await ArsipModel.delete(id);
    await ActivityLogModel.create({
      user_id: req.user.id, aksi: 'HAPUS_PERMANEN_ARSIP', modul: 'arsip', referensi_id: id,
      deskripsi: `Menghapus permanen arsip "${existing.judul}" (${existing.nomor_klasifikasi}) dari Sampah`, ip_address: req.ip,
    });
    await notifyAllExcept(req.user.id, {
      judul: 'Arsip dihapus permanen',
      pesan: `${req.user.nama_lengkap} menghapus permanen arsip "${existing.judul}"`,
      tipe: 'arsip', modul: 'arsip', referensi_id: id,
    });
    res.json({ success: true, message: 'Arsip berhasil dihapus permanen dari sistem.' });
  } catch (err) {
    next(err);
  }
};

exports.uploadLampiran = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await ArsipModel.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Arsip tidak ditemukan.' });
    if (!canManageArsip(req.user, existing)) {
      return res.status(403).json({ success: false, message: 'Anda hanya dapat mengelola lampiran arsip yang Anda input sendiri.' });
    }

    const lampiranBaru = [];

    if (req.files && req.files.length) {
      for (const file of req.files) {
        const buffer = fs.readFileSync(file.path);
        const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
        const lampiranId = await LampiranModel.create({
          arsip_id: id, jenis_lampiran: 'file', nama_file: file.filename, nama_file_asli: file.originalname,
          path_file: `/uploads/arsip/${file.filename}`, tipe_file: file.mimetype,
          ukuran_file_kb: Math.round(file.size / 1024), checksum_sha256: checksum, diunggah_oleh: req.user.id,
        });
        lampiranBaru.push(await LampiranModel.findById(lampiranId));
      }
    }

    const parsedLinks = parseLinksInput(req.body.links);
    for (const link of parsedLinks) {
      const lampiranId = await LampiranModel.create({
        arsip_id: id, jenis_lampiran: 'link', nama_file_asli: link.label || link.url,
        path_file: link.url, tipe_file: 'link', diunggah_oleh: req.user.id,
      });
      lampiranBaru.push(await LampiranModel.findById(lampiranId));
    }

    if (!lampiranBaru.length) {
      return res.status(400).json({ success: false, message: 'Tidak ada file atau tautan yang ditambahkan.' });
    }

    await ActivityLogModel.create({
      user_id: req.user.id, aksi: 'UNGGAH_LAMPIRAN', modul: 'arsip', referensi_id: id,
      deskripsi: `Menambahkan ${lampiranBaru.length} lampiran ke arsip "${existing.judul}"`, ip_address: req.ip,
    });
    await notifyAllExcept(req.user.id, {
      judul: 'Lampiran arsip ditambahkan',
      pesan: `${req.user.nama_lengkap} menambahkan ${lampiranBaru.length} lampiran ke arsip "${existing.judul}"`,
      tipe: 'arsip', modul: 'arsip', referensi_id: id,
    });

    res.status(201).json({ success: true, message: 'Lampiran berhasil ditambahkan.', data: lampiranBaru });
  } catch (err) {
    next(err);
  }
};

exports.deleteLampiran = async (req, res, next) => {
  try {
    const { lampiranId } = req.params;
    const lampiran = await LampiranModel.findById(lampiranId);
    if (!lampiran) return res.status(404).json({ success: false, message: 'Lampiran tidak ditemukan.' });

    const arsip = await ArsipModel.findByIdAny(lampiran.arsip_id);
    if (arsip && !canManageArsip(req.user, arsip)) {
      return res.status(403).json({ success: false, message: 'Anda hanya dapat menghapus lampiran arsip yang Anda input sendiri.' });
    }

    if (lampiran.jenis_lampiran === 'file' && lampiran.nama_file) {
      const filePath = path.join(__dirname, '..', 'uploads', 'arsip', lampiran.nama_file);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await LampiranModel.delete(lampiranId);

    await ActivityLogModel.create({
      user_id: req.user.id, aksi: 'HAPUS_LAMPIRAN', modul: 'arsip', referensi_id: lampiran.arsip_id,
      deskripsi: `Menghapus lampiran "${lampiran.nama_file_asli}"`, ip_address: req.ip,
    });
    if (arsip) {
      await notifyAllExcept(req.user.id, {
        judul: 'Lampiran arsip dihapus',
        pesan: `${req.user.nama_lengkap} menghapus lampiran "${lampiran.nama_file_asli}" dari arsip "${arsip.judul}"`,
        tipe: 'arsip', modul: 'arsip', referensi_id: lampiran.arsip_id,
      });
    }

    res.json({ success: true, message: 'Lampiran berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
};

// Mengunduh lampiran berjenis file, atau mengalihkan (redirect) ke URL
// tautan eksternal untuk lampiran berjenis link.
exports.downloadLampiran = async (req, res, next) => {
  try {
    const { lampiranId } = req.params;
    const lampiran = await LampiranModel.findById(lampiranId);
    if (!lampiran) return res.status(404).json({ success: false, message: 'Lampiran tidak ditemukan.' });

    await ArsipModel.incrementDownloads(lampiran.arsip_id);
    await ActivityLogModel.create({
      user_id: req.user.id, aksi: lampiran.jenis_lampiran === 'link' ? 'BUKA_TAUTAN' : 'UNDUH_LAMPIRAN', modul: 'arsip', referensi_id: lampiran.arsip_id,
      deskripsi: `${lampiran.jenis_lampiran === 'link' ? 'Membuka tautan' : 'Mengunduh file'} "${lampiran.nama_file_asli}"`, ip_address: req.ip,
    });

    if (lampiran.jenis_lampiran === 'link') {
      return res.redirect(lampiran.path_file);
    }

    const filePath = path.join(__dirname, '..', 'uploads', 'arsip', lampiran.nama_file);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File fisik tidak ditemukan di server.' });

    res.download(filePath, lampiran.nama_file_asli);
  } catch (err) {
    next(err);
  }
};
